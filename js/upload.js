/**
 * upload.js
 * ------------------------------------------------------------------
 * Drag-and-drop file upload for the Upload page.
 * Validates type/size, previews selected files, uploads to Supabase
 * Storage via supabase-storage.js. No OCR or text extraction here.
 * ------------------------------------------------------------------
 */

(function () {
  "use strict";

  const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"];
  const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  let queue = []; // { id, file, status: pending|uploading|done|error, error, previewUrl }
  let idCounter = 0;

  /* ---------------------------------------------------------------
   * Helpers
   * --------------------------------------------------------------- */
  function formatBytes(bytes) {
    if (bytes === null || bytes === undefined) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getExtension(fileName) {
    return (fileName.split(".").pop() || "").toLowerCase();
  }

  function isAllowedFile(file) {
    const ext = getExtension(file.name);
    return ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIME_TYPES.includes(file.type);
  }

  function showValidationError(message) {
    const el = document.getElementById("uploadValidationError");
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    clearTimeout(showValidationError._t);
    showValidationError._t = setTimeout(() => { el.hidden = true; }, 5000);
  }

  /* ---------------------------------------------------------------
   * Queue management
   * --------------------------------------------------------------- */
  function addFiles(fileList) {
    const rejected = [];

    Array.from(fileList).forEach((file) => {
      if (!isAllowedFile(file)) {
        rejected.push(`${file.name} (unsupported type)`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        rejected.push(`${file.name} (exceeds 10 MB)`);
        return;
      }

      const ext = getExtension(file.name);
      const isImage = ["jpg", "jpeg", "png"].includes(ext);

      queue.push({
        id: ++idCounter,
        file,
        status: "pending",
        error: null,
        previewUrl: isImage ? URL.createObjectURL(file) : null,
        isImage
      });
    });

    if (rejected.length) {
      showValidationError(`Skipped: ${rejected.join(", ")}`);
    }

    renderQueue();
  }

  function removeFile(id) {
    const item = queue.find((q) => q.id === id);
    if (item && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    queue = queue.filter((q) => q.id !== id);
    renderQueue();
  }

  /* ---------------------------------------------------------------
   * Rendering
   * --------------------------------------------------------------- */
  function renderQueue() {
    const section = document.getElementById("queueSection");
    const grid = document.getElementById("fileGrid");
    const summary = document.getElementById("queueSummary");
    const uploadAllBtn = document.getElementById("uploadAllBtn");
    if (!section || !grid || !summary || !uploadAllBtn) return;

    if (queue.length === 0) {
      section.hidden = true;
      grid.innerHTML = "";
      return;
    }

    section.hidden = false;
    const pendingCount = queue.filter((q) => q.status === "pending" || q.status === "error").length;
    summary.textContent = `${queue.length} file${queue.length > 1 ? "s" : ""} selected`;
    uploadAllBtn.disabled = pendingCount === 0;
    uploadAllBtn.textContent = pendingCount === 0 ? "All Uploaded" : "Upload All";

    grid.innerHTML = queue.map((item) => {
      const thumb = item.isImage
        ? `<img src="${item.previewUrl}" alt="${item.file.name}" />`
        : `<div class="pdf-icon">
             <svg viewBox="0 0 24 24" fill="none"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 2v5h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
             PDF
           </div>`;

      let actions = "";
      if (item.status === "pending") {
        actions = `<button data-action="remove" data-id="${item.id}">Remove</button>`;
      } else if (item.status === "error") {
        actions = `<button class="retry-btn" data-action="retry" data-id="${item.id}">Retry</button>
                   <button data-action="remove" data-id="${item.id}">Remove</button>`;
      } else if (item.status === "done") {
        actions = `<button data-action="remove" data-id="${item.id}">Clear</button>`;
      }

      return `
        <div class="file-card">
          <div class="file-thumb">${thumb}</div>
          <div class="file-meta">
            <div class="file-name" title="${item.file.name}">${item.file.name}</div>
            <div class="file-size">${formatBytes(item.file.size)}</div>
            <span class="file-status ${item.status}">${item.status}</span>
            ${item.status === "error" ? `<div class="file-size" style="color:var(--red)">${item.error}</div>` : ""}
            <div class="file-actions">${actions}</div>
          </div>
        </div>`;
    }).join("");
  }

  function renderHistory(items) {
    const list = document.getElementById("uploadHistory");
    if (!list) return;

    if (!items.length) {
      list.innerHTML = `<li class="empty-state">No files uploaded yet.</li>`;
      return;
    }

    list.innerHTML = items.map((f) => {
      const ext = getExtension(f.name).toUpperCase();
      const date = f.createdAt
        ? new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "—";
      return `
        <li>
          <div class="hist-icon">${ext}</div>
          <div class="hist-name" title="${f.name}">${f.name}</div>
          <div class="hist-date">${formatBytes(f.sizeBytes)} · ${date}</div>
          ${f.publicUrl ? `<a class="hist-link" href="${f.publicUrl}" target="_blank" rel="noopener">View</a>` : ""}
        </li>`;
    }).join("");
  }

  async function loadHistory() {
    const list = document.getElementById("uploadHistory");
    if (list) list.innerHTML = `<li class="empty-state">Loading…</li>`;
    try {
      const items = await SupabaseStorage.listUploads(20);
      renderHistory(items);
    } catch (err) {
      if (list) list.innerHTML = `<li class="empty-state" style="color:var(--red)">${err.message}</li>`;
    }
  }

  /* ---------------------------------------------------------------
   * Upload orchestration
   * --------------------------------------------------------------- */
  async function uploadItem(item) {
    item.status = "uploading";
    item.error = null;
    renderQueue();
    try {
      await SupabaseStorage.uploadFile(item.file);
      item.status = "done";
    } catch (err) {
      item.status = "error";
      item.error = err.message;
    }
    renderQueue();
  }

  async function uploadAll() {
    const targets = queue.filter((q) => q.status === "pending" || q.status === "error");
    for (const item of targets) {
      await uploadItem(item);
    }
    loadHistory();
  }

  /* ---------------------------------------------------------------
   * Event bindings
   * --------------------------------------------------------------- */
  function bindDropzone() {
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("fileInput");
    const browseBtn = document.getElementById("browseBtn");
    if (!dropzone || !fileInput || !browseBtn) return;

    dropzone.addEventListener("click", (e) => {
      if (e.target === browseBtn) return;
      fileInput.click();
    });
    browseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      addFiles(e.target.files);
      fileInput.value = "";
    });

    ["dragenter", "dragover"].forEach((evt) => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.add("drag-over");
      });
    });

    ["dragleave", "drop"].forEach((evt) => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-over");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });
  }

  function bindQueueActions() {
    const grid = document.getElementById("fileGrid");
    if (!grid) return;

    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const action = btn.dataset.action;

      if (action === "remove") removeFile(id);
      if (action === "retry") {
        const item = queue.find((q) => q.id === id);
        if (item) uploadItem(item).then(loadHistory);
      }
    });
  }

  function bindSidebarToggle() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const toggle = document.getElementById("menuToggle");
    if (!sidebar || !overlay || !toggle) return;

    const open = () => { sidebar.classList.add("open"); overlay.classList.add("show"); };
    const close = () => { sidebar.classList.remove("open"); overlay.classList.remove("show"); };

    toggle.addEventListener("click", open);
    overlay.addEventListener("click", close);
  }

  /* ---------------------------------------------------------------
   * Init
   * --------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    bindDropzone();
    bindQueueActions();
    bindSidebarToggle();

    const uploadAllBtn = document.getElementById("uploadAllBtn");
    if (uploadAllBtn) uploadAllBtn.addEventListener("click", uploadAll);

    const refreshBtn = document.getElementById("refreshUploadsBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", loadHistory);

    loadHistory();
  });
})();
