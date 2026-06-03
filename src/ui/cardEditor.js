import * as state from "../state/boardState.js";
import { el } from "../utils/dom.js";
import { marked } from "marked";

let modalContainer;
let modalDialog;
let titleInput;
let bodyInput;
let previewPanel;
let fileDropArea;
let attachedFileInfo;
let errorBanner;
let saveButton;
let cancelButton;
let closeButton;
let modeButtons;
let activeContext = null;
let attachedFile = null;
let saveCallback = null;
let currentMode = "edit";
let closeTimeoutId = null;
let isClosing = false;

export function initCardEditor() {
  if (modalContainer) return;

  modalContainer = el("div", {
    class:
      "hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 opacity-0 pointer-events-none transition-opacity duration-200 ease-out"
  });

  modalContainer.innerHTML = `
    <div class="relative w-full max-w-4xl rounded-[36px] bg-white shadow-2xl overflow-hidden ring-1 ring-slate-200 transform scale-95 opacity-0 transition-all duration-200 ease-out">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div>
          <h2 id="card-editor-heading" class="text-lg font-semibold text-slate-900">Edit Card</h2>
          <p class="text-sm text-slate-500">Markdown editor with preview and file attachments. Press Ctrl+S to save or Esc to close.</p>
        </div>
        <button type="button" class="close-editor text-2xl leading-none text-slate-500 hover:text-slate-900">×</button>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 p-6">
        <div class="space-y-4">
          <label class="block">
            <span class="text-xs font-semibold text-slate-600">Card Title</span>
            <input id="card-title-input" type="text" class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400" />
          </label>

          <label class="block">
            <span class="text-xs font-semibold text-slate-600">Markdown Body</span>
            <textarea id="card-body-input" rows="12" class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono resize-none outline-none focus:border-blue-400"></textarea>
          </label>

          <div id="file-drop-area" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 text-center transition-all">
            Drag a file here to attach it to the card
          </div>

          <div id="attached-file-info" class="min-h-[1.5rem] text-xs text-slate-500"></div>
          <div id="editor-error-banner" class="hidden rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"></div>
        </div>

        <div class="space-y-4">
          <div class="flex gap-2">
            <button type="button" class="editor-mode-button active px-3 py-2 rounded-2xl text-sm font-medium bg-slate-100 text-slate-800" data-mode="edit">Edit</button>
            <button type="button" class="editor-mode-button px-3 py-2 rounded-2xl text-sm font-medium text-slate-600 border border-slate-200 hover:text-slate-900" data-mode="preview">Preview</button>
          </div>

          <div id="editor-preview" class="h-[420px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 prose prose-slate prose-headings:font-semibold prose-strong:text-slate-900 prose-blockquote:border-l-slate-300 prose-blockquote:text-slate-600 prose-code:rounded-lg prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 max-w-none"></div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
        <button type="button" class="cancel-editor px-4 py-2 rounded-2xl border border-slate-300 text-slate-600">Cancel</button>
        <button type="button" class="save-editor px-4 py-2 rounded-2xl bg-blue-600 text-white">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalContainer);

  modalDialog = modalContainer.querySelector("div.relative");
  titleInput = modalContainer.querySelector("#card-title-input");
  bodyInput = modalContainer.querySelector("#card-body-input");
  previewPanel = modalContainer.querySelector("#editor-preview");
  fileDropArea = modalContainer.querySelector("#file-drop-area");
  attachedFileInfo = modalContainer.querySelector("#attached-file-info");
  errorBanner = modalContainer.querySelector("#editor-error-banner");
  saveButton = modalContainer.querySelector(".save-editor");
  cancelButton = modalContainer.querySelector(".cancel-editor");
  closeButton = modalContainer.querySelector(".close-editor");
  modeButtons = [...modalContainer.querySelectorAll(".editor-mode-button")];

  saveButton.addEventListener("click", onSaveClick);
  cancelButton.addEventListener("click", closeEditor);
  closeButton.addEventListener("click", closeEditor);
  modeButtons.forEach((button) => button.addEventListener("click", onModeButtonClick));
  bodyInput.addEventListener("input", updatePreview);
  fileDropArea.addEventListener("dragover", onFileDragOver);
  fileDropArea.addEventListener("dragleave", onFileDragLeave);
  fileDropArea.addEventListener("drop", onFileDrop);
  modalContainer.addEventListener("click", onContainerClick);
  document.addEventListener("keydown", onDocumentKeydown);

  setEditorMode("edit");
}

export function setOnSave(callback) {
  saveCallback = callback;
}

export function openNewCardEditor(colId) {
  openEditor({ colId, card: null });
}

export function openExistingCardEditor(colId, card) {
  openEditor({ colId, card });
}

function openEditor({ colId, card }) {
  if (closeTimeoutId) {
    window.clearTimeout(closeTimeoutId);
    closeTimeoutId = null;
    isClosing = false;
    modalContainer.classList.remove("hidden", "opacity-0", "pointer-events-none");
    modalDialog.classList.remove("translate-y-4", "scale-95", "opacity-0");
    modalDialog.classList.add("translate-y-0", "scale-100", "opacity-100");
  }

  activeContext = {
    colId,
    cardId: card?.id || null,
    isNew: !card
  };

  titleInput.value = card?.title || "";
  bodyInput.value = card?.body || "";
  attachedFile = card?.file ? { ...card.file } : null;
  updateAttachedFileInfo();
  clearError();
  setEditorMode("edit");
  updatePreview();

  modalContainer.classList.remove("hidden", "opacity-0", "pointer-events-none");
  modalContainer.classList.add("opacity-100");
  requestAnimationFrame(() => {
    modalDialog.classList.remove("scale-95", "opacity-0");
    modalDialog.classList.add("translate-y-0", "scale-100", "opacity-100");
  });

  titleInput.focus();
}

function closeEditor() {
  if (!modalContainer || modalContainer.classList.contains("hidden") || isClosing) return;
  isClosing = true;

  modalDialog.classList.add("translate-y-4", "scale-95", "opacity-0");
  modalContainer.classList.add("opacity-0", "pointer-events-none");
  modalContainer.classList.remove("opacity-100");

  closeTimeoutId = window.setTimeout(() => {
    modalContainer.classList.add("hidden");
    modalDialog.classList.remove("translate-y-0", "scale-100", "opacity-100");
    activeContext = null;
    attachedFile = null;
    isClosing = false;
    closeTimeoutId = null;
  }, 200);
}

function onModeButtonClick(event) {
  const button = event.currentTarget;
  const mode = button.getAttribute("data-mode");
  if (!mode) return;
  setEditorMode(mode);
}

function setEditorMode(mode) {
  currentMode = mode;
  modeButtons.forEach((button) => {
    const isActive = button.getAttribute("data-mode") === mode;
    button.classList.toggle("active", isActive);
    button.classList.toggle("bg-slate-100", isActive);
    button.classList.toggle("text-slate-800", isActive);
    button.classList.toggle("text-slate-600", !isActive);
  });

  if (mode === "preview") {
    previewPanel.style.display = "block";
    updatePreview();
  } else {
    previewPanel.style.display = "none";
  }
}

function updatePreview() {
  if (!previewPanel) return;
  const markdown = bodyInput.value || "";

  try {
    previewPanel.innerHTML = markdown.trim()
      ? marked.parse(markdown)
      : "<p class='text-sm text-slate-500'>Start typing markdown to see a live preview.</p>";
    clearError();
  } catch (error) {
    previewPanel.innerHTML = "<p class='text-sm text-slate-500'>Unable to render preview.</p>";
    showError("Invalid Markdown content. Please check your syntax.");
  }
}

function updateAttachedFileInfo() {
  if (!attachedFile) {
    attachedFileInfo.innerHTML = "";
    return;
  }

  attachedFileInfo.innerHTML = `
    <div class="flex items-center justify-between gap-3 rounded-2xl bg-slate-100 px-3 py-2">
      <div class="flex items-center gap-2">
        <span class="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-200 text-slate-700">📎</span>
        <span class="truncate text-sm text-slate-700">${attachedFile.name}</span>
      </div>
      <button type="button" class="remove-attachment text-xs font-semibold text-blue-600 hover:text-blue-800">Remove</button>
    </div>
  `;

  const removeButton = attachedFileInfo.querySelector(".remove-attachment");
  if (removeButton) {
    removeButton.addEventListener("click", () => {
      attachedFile = null;
      updateAttachedFileInfo();
    });
  }
}

function onFileDragOver(event) {
  event.preventDefault();
  fileDropArea.classList.add("border-blue-400", "bg-blue-50");
}

function onFileDragLeave() {
  fileDropArea.classList.remove("border-blue-400", "bg-blue-50");
}

function onFileDrop(event) {
  event.preventDefault();
  fileDropArea.classList.remove("border-blue-400", "bg-blue-50");

  const files = Array.from(event.dataTransfer.files || []);
  if (!files.length) {
    showError("No file detected. Try dropping a file from your file browser.");
    return;
  }

  const file = files[0];
  if (!file?.path) {
    showError("Unable to attach the dropped file. Please try a different file.");
    return;
  }

  attachedFile = {
    path: file.path,
    name: file.name || file.path.split(/[/\\]/).pop() || "attached-file"
  };

  updateAttachedFileInfo();
  clearError();
}

function onContainerClick(event) {
  if (event.target === modalContainer) {
    closeEditor();
  }
}

function onDocumentKeydown(event) {
  if (!modalContainer || modalContainer.classList.contains("hidden")) return;

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    onSaveClick();
    return;
  }

  if (event.key === "Escape") {
    closeEditor();
  }
}

function showError(message) {
  if (!errorBanner) return;
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
}

function clearError() {
  if (!errorBanner) return;
  errorBanner.textContent = "";
  errorBanner.classList.add("hidden");
}

async function onSaveClick() {
  if (!activeContext) return;

  const payload = {
    title: titleInput.value.trim() || "Untitled Card",
    body: bodyInput.value,
    file: attachedFile ? { ...attachedFile } : null
  };

  if (activeContext.isNew) {
    await state.addCard(activeContext.colId, payload);
  } else {
    await state.updateCard(activeContext.colId, activeContext.cardId, payload);
  }

  closeEditor();
  if (typeof saveCallback === "function") {
    saveCallback();
  }
}
