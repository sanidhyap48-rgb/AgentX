
console.log("AgentX JavaScript loaded successfully");

const API_URL = "http://127.0.0.1:8000";

// =====================================
// 1. GET HTML ELEMENTS
// =====================================

const researchBtn = document.getElementById("researchBtn");
const newResearchBtn = document.getElementById("newResearchBtn");
const questionInput = document.getElementById("researchQuestion");

const message = document.getElementById("message");
const historyList = document.getElementById("historyList");

const researchPlan = document.getElementById("researchPlan");
const report = document.getElementById("report");
const sources = document.getElementById("sources");
const verification = document.getElementById("verification");
const executionLogs = document.getElementById("executionLogs");

const progressTracker = document.getElementById("progressTracker");
const progressSteps = document.querySelectorAll(".progress-step");

const characterCount = document.getElementById("characterCount");
const examplePrompts = document.querySelectorAll(".example-prompt");

// =====================================
// 2. INITIALIZE APPLICATION
// =====================================

function initializeApp() {
    const requiredElements = [
        researchBtn,
        newResearchBtn,
        questionInput,
        message,
        historyList,
        researchPlan,
        report,
        sources,
        verification,
        executionLogs,
        progressTracker
    ];

    if (requiredElements.some(element => !element)) {
        console.error("AgentX: Some HTML elements are missing.");
        return;
    }

    console.log("AgentX interface initialized.");

    researchBtn.addEventListener("click", handleResearch);

    newResearchBtn.addEventListener("click", handleNewResearch);

    // Ctrl + Enter shortcut
    questionInput.addEventListener("keydown", event => {
        if (event.key === "Enter" && event.ctrlKey) {
            event.preventDefault();
            handleResearch();
        }
    });

    // Character counter
    questionInput.addEventListener("input", updateCharacterCount);

    // Example prompt buttons
    examplePrompts.forEach(button => {
        button.addEventListener("click", () => {
            const question = button.dataset.question;

            if (!question) return;

            questionInput.value = question;
            updateCharacterCount();
            questionInput.focus();
        });
    });

    updateCharacterCount();
    loadHistory();
}

// =====================================
// 3. CHARACTER COUNTER
// =====================================

function updateCharacterCount() {
    if (!characterCount) return;

    const count = questionInput.value.length;

    characterCount.textContent = `${count} / 1000 characters`;

    if (count >= 900) {
        characterCount.style.color = "#f59e0b";
    } else {
        characterCount.style.color = "";
    }
}

// =====================================
// 4. CLEAR RESULTS
// =====================================

function clearResults() {
    researchPlan.innerHTML = "";
    report.innerHTML = "";
    sources.innerHTML = "";
    verification.innerHTML = "";
    executionLogs.innerHTML = "";

    message.textContent = "";

    progressTracker.hidden = true;

    progressSteps.forEach(step => {
        step.classList.remove("active", "completed");
    });
}

function handleNewResearch() {
    if (researchBtn.disabled) return;

    questionInput.value = "";

    updateCharacterCount();
    clearResults();

    questionInput.focus();
}

// =====================================
// 5. LOADING STATE
// =====================================

function setLoading(isLoading) {
    researchBtn.disabled = isLoading;

    researchBtn.textContent = isLoading
        ? "Researching..."
        : "Start Research →";

    newResearchBtn.disabled = isLoading;
}

// =====================================
// 6. PROGRESS TRACKER
// =====================================

function updateProgress(stage) {
    const stages = [
        "planning",
        "searching",
        "analysing",
        "verifying",
        "completed"
    ];

    const currentIndex = stages.indexOf(stage);

    if (currentIndex === -1) return;

    progressTracker.hidden = false;

    progressSteps.forEach((step, index) => {
        step.classList.remove("active", "completed");

        if (index < currentIndex) {
            step.classList.add("completed");
        }

        if (index === currentIndex) {
            step.classList.add("active");
        }
    });
}

// =====================================
// 7. SAFE MARKDOWN RENDERING
// =====================================

function renderMarkdown(element, text) {
    const content = text || "";

    if (
        typeof marked !== "undefined" &&
        typeof DOMPurify !== "undefined"
    ) {
        const html = marked.parse(content);
        element.innerHTML = DOMPurify.sanitize(html);
    } else {
        element.textContent = content;
    }
}

// =====================================
// 8. RESEARCH PLAN
// =====================================

function displayResearchPlan(queries) {
    const card = document.createElement("div");
    card.className = "result-card";

    const heading = document.createElement("h2");
    heading.textContent = "Research Plan";

    card.appendChild(heading);

    const list = document.createElement("ul");

    (Array.isArray(queries) ? queries : []).forEach(query => {
        const item = document.createElement("li");
        item.textContent = query;
        list.appendChild(item);
    });

    card.appendChild(list);
    researchPlan.appendChild(card);
}

// =====================================
// 9. RESEARCH REPORT
// =====================================

function displayReport(reportText) {
    const card = document.createElement("div");
    card.className = "result-card";

    const heading = document.createElement("h2");
    heading.textContent = "Research Report";

    const content = document.createElement("div");
    content.className = "markdown-content";

    renderMarkdown(content, reportText);

    card.appendChild(heading);
    card.appendChild(content);

    report.appendChild(card);
}

// =====================================
// 10. SOURCES
// =====================================

function renderSources(sourceData) {
    const card = document.createElement("div");
    card.className = "result-card";

    const heading = document.createElement("h2");
    heading.textContent = "Research Sources";

    card.appendChild(heading);

    if (!Array.isArray(sourceData) || sourceData.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No sources available.";
        card.appendChild(empty);
    } else {
        sourceData.forEach(source => {
            const item = document.createElement("p");
            const link = document.createElement("a");

            link.textContent =
                source.title || source.url || "Untitled source";

            try {
                const url = new URL(source.url);

                if (["http:", "https:"].includes(url.protocol)) {
                    link.href = url.href;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                }
            } catch {
                link.removeAttribute("href");
            }

            item.appendChild(link);
            card.appendChild(item);
        });
    }

    sources.appendChild(card);
}

// =====================================
// 11. SOURCE VERIFICATION
// =====================================

function renderVerification(data) {
    const card = document.createElement("div");
    card.className = "result-card";

    const heading = document.createElement("h2");
    heading.textContent = "Source Verification";

    const content = document.createElement("div");
    content.className = "markdown-content";

    const verificationText =
        typeof data === "string"
            ? data
            : data?.verification_report || JSON.stringify(data, null, 2);

    renderMarkdown(content, verificationText);

    card.appendChild(heading);
    card.appendChild(content);

    verification.appendChild(card);
}

// =====================================
// 12. EXECUTION LOGS
// =====================================

function renderExecutionLogs(logData) {
    executionLogs.innerHTML = "";

    const card = document.createElement("div");
    card.className = "result-card";

    const heading = document.createElement("h2");
    heading.textContent = "Agent Execution Logs";

    card.appendChild(heading);

    if (!Array.isArray(logData) || logData.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No execution logs available.";
        card.appendChild(empty);
    } else {
        logData.forEach(log => {
            const item = document.createElement("p");

            item.textContent =
                `[${log.stage}] ${log.message} — ${log.status}`;

            card.appendChild(item);
        });
    }

    executionLogs.appendChild(card);
}

async function loadExecutionLogs() {
    try {
        const response = await fetch(`${API_URL}/logs`);

        if (!response.ok) {
            throw new Error("Could not load execution logs.");
        }

        const result = await response.json();

        renderExecutionLogs(result.logs);

    } catch (error) {
        console.error("Execution logs error:", error);
    }
}

// =====================================
// 13. RESEARCH HISTORY
// =====================================

async function loadHistory() {
    try {
        const response = await fetch(`${API_URL}/history`);

        if (!response.ok) {
            throw new Error("Could not load research history.");
        }

        const result = await response.json();

        historyList.innerHTML = "";

        const history = result.history || [];

        if (history.length === 0) {
            historyList.textContent = "No research history yet.";
            return;
        }

        history.forEach(item => {
            const historyItem = document.createElement("div");

            historyItem.className = "history-item";
            historyItem.textContent = item.question;
            historyItem.title = item.question;
            historyItem.tabIndex = 0;

            historyItem.addEventListener("click", () => {
                loadResearch(item.id);
            });

            historyItem.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    loadResearch(item.id);
                }
            });

            historyList.appendChild(historyItem);
        });

    } catch (error) {
        historyList.textContent = "Backend connection unavailable.";
        console.error("History error:", error);
    }
}

// =====================================
// 14. LOAD SAVED RESEARCH
// =====================================

function parseStoredData(value) {
    if (typeof value !== "string") return value;

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

async function loadResearch(id) {
    if (researchBtn.disabled) return;

    clearResults();

    message.textContent = "Loading saved research...";

    try {
        const response = await fetch(`${API_URL}/history/${id}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || "Could not load saved research."
            );
        }

        const data = result.data;

        questionInput.value = data.question;
        updateCharacterCount();

        if (data.research_plan) {
            displayResearchPlan(parseStoredData(data.research_plan));
        }

        displayReport(data.report);

        renderSources(parseStoredData(data.sources));

        renderVerification(parseStoredData(data.verification));

        message.textContent = "Saved research loaded successfully.";

    } catch (error) {
        message.textContent = error.message;
        console.error("Load research error:", error);
    }
}

// =====================================
// 15. PROCESS STREAM EVENTS
// =====================================

function processStreamEvent(event) {
    console.log("AgentX stream event:", event);

    if (event.type === "progress") {
        message.textContent = event.message;
        updateProgress(event.stage);
    }

    else if (event.type === "completed") {
        const data = event.data || {};

        displayResearchPlan(data.research_plan);
        displayReport(data.report);
        renderSources(data.sources);
        renderVerification(data.verification);

        updateProgress("completed");

        message.textContent =
            `Research completed successfully! Report ID: ${event.research_id}`;
    }

    else if (event.type === "error") {
        throw new Error(event.message || "Research failed.");
    }
}

// =====================================
// 16. READ SERVER-SENT EVENTS
// =====================================

async function streamResearch(question) {
    const response = await fetch(`${API_URL}/research-stream`, {
        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
        },

        body: JSON.stringify({ question })
    });

    if (!response.ok) {
        let errorMessage = "Could not start research.";

        try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
        } catch {
            // Keep default message.
        }

        throw new Error(errorMessage);
    }

    if (!response.body) {
        throw new Error("Browser does not support response streaming.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let completed = false;

    function processEventBlock(block) {
        const dataLines = block
            .split(/\r?\n/)
            .filter(line => line.startsWith("data:"))
            .map(line => line.slice(5).trimStart());

        if (dataLines.length === 0) return;

        const jsonText = dataLines.join("\n");
        const event = JSON.parse(jsonText);

        processStreamEvent(event);

        if (event.type === "completed") {
            completed = true;
        }
    }

    try {
        while (true) {
            const { value, done } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const blocks = buffer.split(/\r?\n\r?\n/);

            buffer = blocks.pop() || "";

            for (const block of blocks) {
                processEventBlock(block);
            }
        }

        buffer += decoder.decode();

        if (buffer.trim()) {
            processEventBlock(buffer);
        }

    } finally {
        reader.releaseLock();
    }

    if (!completed) {
        throw new Error("Research stream ended before completion.");
    }
}

// =====================================
// 17. START RESEARCH
// =====================================

async function handleResearch() {
    console.log("Research button clicked");

    if (researchBtn.disabled) return;

    const question = questionInput.value.trim();

    if (question.length < 5) {
        message.textContent =
            "Please enter a research question with at least 5 characters.";
        questionInput.focus();
        return;
    }

    clearResults();

    setLoading(true);

    progressTracker.hidden = false;
    updateProgress("planning");

    message.textContent = "Connecting to AgentX...";

    try {
        await streamResearch(question);

        await loadHistory();

    } catch (error) {
        console.error("Research error:", error);

        message.textContent =
            `Research failed: ${error.message}`;

    } finally {
        await loadExecutionLogs();

        setLoading(false);
    }
}

// =====================================
// 18. START APPLICATION
// =====================================

initializeApp();
