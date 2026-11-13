
import asyncio
import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.agent import ask_gemini, research_topic
from backend.database import (
    initialize_database,
    save_research,
    get_research_history,
    save_execution_log,
    get_execution_logs
)

app = FastAPI(title="AgentX API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://192.168.0.106:5500",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_safe_error(error):
    error_text = str(error).lower()

    if "429" in error_text or "rate_limit" in error_text:
        return 429, "AI service rate limit reached. Please try again later."

    if "resource_exhausted" in error_text:
        return 429, "AI service quota exceeded. Please try again later."

    if "503" in error_text or "service unavailable" in error_text:
        return 503, "AI service is temporarily unavailable."

    if "timeout" in error_text:
        return 504, "The request timed out. Please try again."

    if "tavily" in error_text:
        return 502, "Web search service failed. Please try again."

    return 500, "An unexpected error occurred during processing."


@app.on_event("startup")
def startup():
    initialize_database()


class GeminiRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=5000)


class ResearchRequest(BaseModel):
    question: str = Field(min_length=5, max_length=1000)


def make_sse_event(event_type, **data):
    return (
        "data: "
        + json.dumps(
            {
                "type": event_type,
                **data
            },
            ensure_ascii=False,
            default=str
        )
        + "\n\n"
    )


@app.get("/")
def home():
    return {
        "project": "AgentX",
        "status": "running"
    }


@app.post("/test-gemini")
def test_gemini(request: GeminiRequest):
    try:
        answer = ask_gemini(request.prompt)

        return {
            "status": "success",
            "answer": answer
        }

    except Exception as e:
        print("AI ERROR:", repr(e))

        status_code, message = get_safe_error(e)

        raise HTTPException(
            status_code=status_code,
            detail=message
        )


@app.post("/research")
def research(request: ResearchRequest):
    try:
        result = research_topic(request.question)

        research_id = save_research(result)

        return {
            "status": "success",
            "research_id": research_id,
            "data": result
        }

    except Exception as e:
        print("RESEARCH ERROR:", repr(e))

        status_code, message = get_safe_error(e)

        raise HTTPException(
            status_code=status_code,
            detail=message
        )


@app.post("/research-stream")
async def research_stream(request: ResearchRequest):

    async def event_stream():

        event_queue = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def progress_callback(event):

            try:
                save_execution_log(
                    stage=event["stage"],
                    message=event["message"],
                    status=(
                        "success"
                        if event["stage"] == "completed"
                        else "info"
                    )
                )

            except Exception as e:
                print("LOG SAVE ERROR:", repr(e))

            loop.call_soon_threadsafe(
                event_queue.put_nowait,
                event
            )

        def run_research():

            try:
                print("STARTING RESEARCH:", request.question)

                result = research_topic(
                    request.question,
                    progress_callback
                )

                print("RESEARCH GENERATED SUCCESSFULLY")

                research_id = save_research(result)

                print("RESEARCH SAVED. ID:", research_id)

                return {
                    "research_id": research_id,
                    "data": result
                }

            except Exception as e:
                print("BACKGROUND RESEARCH ERROR:", repr(e))
                raise

            finally:
                loop.call_soon_threadsafe(
                    event_queue.put_nowait,
                    None
                )

        task = asyncio.create_task(
            asyncio.to_thread(run_research)
        )

        try:

            # Send progress events
            while True:

                event = await event_queue.get()

                if event is None:
                    break

                yield make_sse_event(
                    "progress",
                    **event
                )

            # Wait for the complete research result
            completed_result = await task

            # Send the actual result to the frontend
            print("SENDING COMPLETED EVENT TO FRONTEND")

            yield make_sse_event(
                "completed",
                research_id=completed_result["research_id"],
                data=completed_result["data"]
            )

        except Exception as e:

            print("STREAM RESEARCH ERROR:", repr(e))

            status_code, message = get_safe_error(e)

            yield make_sse_event(
                "error",
                code=status_code,
                message=message
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )


@app.get("/history")
def history():

    try:
        records = get_research_history()

        return {
            "status": "success",
            "total": len(records),
            "history": records
        }

    except Exception as e:

        print("HISTORY ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve research history."
        )


@app.get("/history/{research_id}")
def get_history_item(research_id: int):

    try:
        records = get_research_history()

        for record in records:

            if record["id"] == research_id:

                return {
                    "status": "success",
                    "data": record
                }

        raise HTTPException(
            status_code=404,
            detail="Research record not found."
        )

    except HTTPException:
        raise

    except Exception as e:

        print("HISTORY ITEM ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve research record."
        )


@app.get("/logs")
def execution_logs():

    try:
        records = get_execution_logs()

        return {
            "status": "success",
            "total": len(records),
            "logs": records
        }

    except Exception as e:

        print("LOG RETRIEVAL ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Could not retrieve execution logs."
        )
