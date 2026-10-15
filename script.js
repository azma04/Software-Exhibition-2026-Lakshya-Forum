"use strict";

/* =========================================
   COMMON FUNCTIONS
========================================= */

function openTool(id) {
    const tool = document.getElementById(id);
    if (!tool) {
        alert("Tool section not found: " + id);
        return;
    }

    document.querySelectorAll(".workspace").forEach(section => {
        section.classList.remove("active");
    });

    tool.classList.add("active");
    tool.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeTool(id) {
    document.getElementById(id)?.classList.remove("active");
}

function showMessage(elementId, message, type = "") {
    const element = document.getElementById(elementId);
    element.replaceChildren();

    const paragraph = document.createElement("p");
    paragraph.className = type;
    paragraph.textContent = message;
    element.appendChild(paragraph);
}

function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function getExtension(name) {
    const dot = name.lastIndexOf(".");
    return dot > 0 ? name.substring(dot + 1).toUpperCase() : "No extension";
}

function addText(parent, tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    parent.appendChild(element);
    return element;
}

/* =========================================
   SECURE HASHING HELPER
========================================= */

async function sha256(file) {
    if (!window.crypto?.subtle) {
        throw new Error(
            "SHA-256 is unavailable. Open this project through VS Code Live Server or another secure localhost connection."
        );
    }

    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);

    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

/* =========================================
   TOOL 1: PASSWORD STRENGTH CHECKER
========================================= */

function togglePassword() {
    const input = document.getElementById("passwordInput");
    input.type = input.type === "password" ? "text" : "password";
}

function checkPassword() {
    const password = document.getElementById("passwordInput").value;
    const bar = document.getElementById("strengthBar");
    const text = document.getElementById("strengthText");
    const checks = document.getElementById("passwordChecks");

    const rules = [
        ["At least 12 characters", password.length >= 12],
        ["Contains uppercase letter", /[A-Z]/.test(password)],
        ["Contains lowercase letter", /[a-z]/.test(password)],
        ["Contains a number", /[0-9]/.test(password)],
        ["Contains a symbol", /[^A-Za-z0-9]/.test(password)]
    ];

    checks.replaceChildren();

    rules.forEach(([label, passed]) => {
        const item = document.createElement("div");
        item.className = "check-item" + (passed ? " pass" : "");
        item.textContent = (passed ? "✓ " : "○ ") + label;
        checks.appendChild(item);
    });

    const score = rules.filter(rule => rule[1]).length;
    const levels = [
        ["Very Weak", "#ff6384"],
        ["Weak", "#ff965c"],
        ["Fair", "#ffd166"],
        ["Good", "#72d6a0"],
        ["Strong", "#36e7a0"],
        ["Very Strong", "#00e5ff"]
    ];

    bar.style.width = password.length === 0 ? "0%" : `${score * 20}%`;
    bar.style.background = levels[score][1];
    text.textContent = password.length === 0
        ? "Waiting for password"
        : `${levels[score][0]} — ${score}/5 checks passed`;

    text.style.color = levels[score][1];
}

/* =========================================
   TOOL 2: FILE INTEGRITY CHECKER
========================================= */

async function checkIntegrity() {
    const reference = document.getElementById("referenceFile").files[0];
    const current = document.getElementById("integrityFile").files[0];
    const result = document.getElementById("integrityResult");

    result.replaceChildren();

    if (!current) {
        showMessage("integrityResult", "Please choose a file to check.", "status-warn");
        return;
    }

    addText(result, "p", "Calculating SHA-256 hash…");

    try {
        const currentHash = await sha256(current);
        result.replaceChildren();

        addText(result, "h3", "File Integrity Report");
        addText(result, "p", `File: ${current.name}`);
        addText(result, "p", "SHA-256:");
        addText(result, "p", currentHash, "hash");

        if (reference) {
            const referenceHash = await sha256(reference);

            addText(result, "p", `Reference file: ${reference.name}`);
            addText(result, "p", "Reference SHA-256:");
            addText(result, "p", referenceHash, "hash");

            if (referenceHash === currentHash) {
                addText(result, "p", "✓ HASH MATCH — Contents match.", "status-good");
            } else {
                addText(result, "p", "⚠ HASH MISMATCH — Contents differ.", "status-bad");
            }
        } else {
            addText(
                result,
                "p",
                "No reference file selected. Save this hash as a baseline using a trusted process before making a future comparison.",
                "status-warn"
            );
        }
    } catch (error) {
        showMessage("integrityResult", error.message || "Unable to calculate the hash.", "status-bad");
    }
}

/* =========================================
   TOOL 3: DIGITAL EVIDENCE METADATA ANALYZER
========================================= */

function analyzeMetadata() {
    const file = document.getElementById("metadataFile").files[0];
    const result = document.getElementById("metadataResult");
    const preview = document.getElementById("metadataPreview");

    result.replaceChildren();
    preview.replaceChildren();

    if (!file) {
        showMessage("metadataResult", "Please select a file.");
        return;
    }

    addText(result, "h3", "🔎 File Metadata Report");

    const grid = document.createElement("div");
    grid.className = "metadata-grid";

    const metadata = [
        ["File name", file.name],
        ["File size", formatFileSize(file.size)],
        ["File size in bytes", String(file.size)],
        ["Extension", getExtension(file.name)],
        ["MIME type", file.type || "Unknown"],
        ["Last modified (local time)", file.lastModified
            ? new Date(file.lastModified).toLocaleString()
            : "Unavailable"]
    ];

    metadata.forEach(([label, value]) => {
        const item = document.createElement("div");
        item.className = "metadata-item";
        addText(item, "span", label);
        addText(item, "strong", value);
        grid.appendChild(item);
    });

    result.appendChild(grid);

    if (file.type.startsWith("image/")) {
        const image = document.createElement("img");
        const objectURL = URL.createObjectURL(file);
        image.alt = "Preview of selected image";
        image.src = objectURL;

        image.onload = () => {
            const dimensions = document.createElement("div");
            dimensions.className = "metadata-item";
            addText(dimensions, "span", "Image dimensions");
            addText(
                dimensions,
                "strong",
                `${image.naturalWidth} × ${image.naturalHeight} pixels`
            );
            grid.appendChild(dimensions);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectURL);
            preview.replaceChildren();
            addText(preview, "p", "The image preview could not be loaded.");
        };

        preview.appendChild(image);
    } else {
        addText(preview, "p", "Preview is not available for this file type.");
    }
}

/* =========================================
   TOOL 4: EVIDENCE TAMPERING DETECTOR
========================================= */

async function detectTampering() {
    const original = document.getElementById("evidenceOriginal").files[0];
    const current = document.getElementById("evidenceCurrent").files[0];
    const result = document.getElementById("tamperingResult");

    result.replaceChildren();

    if (!original || !current) {
        showMessage(
            "tamperingResult",
            "Please select both the reference file and the file being examined.",
            "status-warn"
        );
        return;
    }

    addText(result, "p", "Comparing SHA-256 hashes…");

    try {
        const [originalHash, currentHash] = await Promise.all([
            sha256(original),
            sha256(current)
        ]);

        result.replaceChildren();
        addText(result, "h3", "Evidence Comparison Report");
        addText(result, "p", `Reference: ${original.name}`);
        addText(result, "p", originalHash, "hash");
        addText(result, "p", `Examined file: ${current.name}`);
        addText(result, "p", currentHash, "hash");

        if (originalHash === currentHash) {
            addText(result, "p", "✓ HASH MATCH — The file contents match.", "status-good");
            addText(result, "p", "This result does not independently prove authenticity or chain of custody.");
        } else {
            addText(result, "p", "⚠ HASH MISMATCH — The file contents differ.", "status-bad");
            addText(result, "p", "A difference may result from editing, conversion, corruption, or other changes. Further investigation is needed.");
        }
    } catch (error) {
        showMessage("tamperingResult", error.message || "Comparison failed.", "status-bad");
    }
}

/* =========================================
   TOOL 5: BROWSER FORENSICS TIMELINE
========================================= */

let sortedTimeline = [];

function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    text = text.replace(/^\uFEFF/, "");

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (quoted) {
            if (char === '"' && text[i + 1] === '"') {
                field += '"';
                i++;
            } else if (char === '"') {
                quoted = false;
            } else {
                field += char;
            }
        } else if (char === '"' && field.length === 0) {
            quoted = true;
        } else if (char === ",") {
            row.push(field);
            field = "";
        } else if (char === "\n" || char === "\r") {
            if (char === "\r" && text[i + 1] === "\n") i++;
            row.push(field);
            if (row.some(value => value.trim() !== "")) rows.push(row);
            row = [];
            field = "";
        } else {
            field += char;
        }
    }

    if (field.length || row.length) {
        row.push(field);
        if (row.some(value => value.trim() !== "")) rows.push(row);
    }

    return rows;
}

async function buildTimeline() {
    const file = document.getElementById("browserFile").files[0];
    const body = document.getElementById("timelineBody");
    const summary = document.getElementById("timelineSummary");

    body.replaceChildren();
    sortedTimeline = [];

    if (!file) {
        showMessage("timelineSummary", "Please select a browser-history CSV.", "status-warn");
        return;
    }

    try {
        const text = await file.text();
        const rows = parseCSV(text);

        if (rows.length < 2) {
            showMessage("timelineSummary", "The CSV has no data rows or is empty.", "status-warn");
            return;
        }

        const headers = rows[0].map(h => h.trim().toLowerCase());

        const timeIndex = headers.findIndex(h =>
            ["timestamp", "date", "datetime", "visit time", "last visit time"].includes(h)
        );
        const urlIndex = headers.findIndex(h =>
            ["url", "website", "address"].includes(h)
        );
        const titleIndex = headers.findIndex(h =>
            ["title", "page title", "name"].includes(h)
        );

        if (timeIndex === -1 || urlIndex === -1) {
            showMessage(
                "timelineSummary",
                "Required columns not found. Include timestamp (or date) and url headers. Title is optional.",
                "status-warn"
            );
            return;
        }

        sortedTimeline = rows.slice(1).map(row => {
            const timestamp = (row[timeIndex] || "").trim();
            const url = (row[urlIndex] || "").trim();
            const title = titleIndex === -1 ? "" : (row[titleIndex] || "").trim();

            return {
                timestamp,
                dateValue: Date.parse(timestamp),
                title,
                url
            };
        }).filter(item => item.timestamp && item.url && Number.isFinite(item.dateValue));

        sortedTimeline.sort((a, b) => a.dateValue - b.dateValue);

        if (sortedTimeline.length === 0) {
            showMessage(
                "timelineSummary",
                "No valid records found. Check that timestamps are recognizable date/time values.",
                "status-warn"
            );
            return;
        }

        sortedTimeline.forEach(item => {
            const tr = document.createElement("tr");
            addText(tr, "td", new Date(item.dateValue).toLocaleString());
            addText(tr, "td", item.title || "(No title)");

            const urlCell = document.createElement("td");
            const urlText = document.createElement("span");
            urlText.textContent = item.url;
            urlCell.appendChild(urlText);
            tr.appendChild(urlCell);

            body.appendChild(tr);
        });

        showMessage(
            "timelineSummary",
            `${sortedTimeline.length} valid record(s) loaded and sorted from oldest to newest.`,
            "status-good"
        );
    } catch (error) {
        showMessage("timelineSummary", "Could not read the CSV file.", "status-bad");
    }
}

function downloadTimeline() {
    if (sortedTimeline.length === 0) {
        alert("Build a timeline before exporting.");
        return;
    }

    const escapeCSV = value =>
        '"' + String(value).replace(/"/g, '""') + '"';

    const rows = [
        ["timestamp", "title", "url"],
        ...sortedTimeline.map(item => [
            item.timestamp,
            item.title,
            item.url
        ])
    ];

    const csv = rows.map(row => row.map(escapeCSV).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "browser-forensics-timeline.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}