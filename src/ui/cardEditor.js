import * as state from "../state/boardState.js";
import { el } from "../utils/dom.js";
import { marked } from "marked";
import { sanitizeHTML, escapeHtml } from "../utils/sanitize.js";
import { sanitizeAttachment } from "../utils/attachment.js";

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
    class: "sb-hidden sb-editor-overlay sb-editor-fade-out"
  });

  modalContainer.innerHTML = `
    <div class="sb-editor-dialog sb-editor-exit">

      <div class="sb-editor-header">
        <div>
          <h2 id="card-editor-heading" class="sb-editor-title">Edit Card</h2>
          <p class="sb-editor-subtitle">
            Markdown editor with preview and file attachments. Press Ctrl+S to save or Esc to close.
          </p>
        </div>
        <button type="button" class="close-editor sb-editor-close">×</button>
      </div>

      <div class="sb-editor-body">

        <div class="sb-editor-left">
          <label class="sb-editor-label">
            <span class="sb-editor-label-text">Card Title</span>
            <input id="card-title-input" type="text" class="sb-editor-input" />
          </label>

          <label class="sb-editor-label">
            <span class="sb-editor-label-text">Markdown Body</span>
            <textarea id="card-body-input" rows="12" class="sb-editor-textarea"></textarea>
          </label>

          <div id="file-drop-area" class="sb-editor-dropzone">
            Drag a file here to attach it to the card
          </div>

          <div id="attached-file-info" class="sb-editor-fileinfo"></div>
          <div id="editor-error-banner" class="sb-editor-error sb-hidden"></div>
        </div>

        <div class="sb-editor-right">
          <div class="sb-editor-modebar">
            <button type="button" class="editor-mode-button sb-editor-mode-active" data-mode="edit">Edit</button>
            <button type="button" class="editor-mode-button sb-editor-mode-inactive" data-mode="preview">Preview</button>
          </div>

          <div id="editor-preview" class="sb-editor-preview"></div>
        </div>

      </div>

      <div class="sb-editor-footer">
        <button type="button" class="cancel-editor sb-header-btn sb-btn-secondary">Cancel</button>
        <button type="button" class="save-editor sb-header-btn sb-btn-primary">Save</button>
      </div>


    </div>
  `;


document.body.appendChild(modalContainer);

// semantic selector instead of Tailwind "relative"
modalDialog = modalContainer.querySelector(".sb-editor-dialog");

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

    // Remove exit animation classes
    modalContainer.classList.remove("sb-hidden", "sb-editor-fade-out");
    modalDialog.classList.remove("sb-editor-exit");

    // Add entry animation classes
    modalContainer.classList.add("sb-editor-fade-in");
    modalDialog.classList.add("sb-editor-enter");
  }

  activeContext = {
    colId,
    cardId: card?.id || null,
    isNew: !card
  };

  titleInput.value = card?.title || "";
  bodyInput.value = card?.body || "";
  attachedFile = sanitizeAttachment(card?.file) || null;

  updateAttachedFileInfo();
  clearError();
  setEditorMode("edit");
  updatePreview();

  // Show modal
  modalContainer.classList.remove("sb-hidden", "sb-editor-fade-out");
  modalContainer.classList.add("sb-editor-fade-in");

  requestAnimationFrame(() => {
    modalDialog.classList.remove("sb-editor-exit");
    modalDialog.classList.add("sb-editor-enter");
  });

  titleInput.focus();
}


function closeEditor() {
  if (!modalContainer || modalContainer.classList.contains("sb-hidden") || isClosing) return;
  isClosing = true;

  // Exit animation (semantic classes)
  modalDialog.classList.add("sb-editor-exit");
  modalContainer.classList.add("sb-editor-fade-out");
  modalContainer.classList.remove("sb-editor-fade-in");

  closeTimeoutId = window.setTimeout(() => {
    modalContainer.classList.add("sb-hidden");

    // Reset entry animation classes
    modalDialog.classList.remove("sb-editor-enter");
    modalDialog.classList.remove("sb-editor-exit");

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

    button.classList.toggle("sb-editor-mode-active", isActive);
    button.classList.toggle("sb-editor-mode-inactive", !isActive);
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
      ? sanitizeHTML(marked.parse(markdown))
      : "<p class='sb-editor-preview-empty'>Start typing markdown to see a live preview.</p>";

    clearError();
  } catch (error) {
    previewPanel.innerHTML = "<p class='sb-editor-preview-empty'>Unable to render preview.</p>";
    showError("Invalid Markdown content. Please check your syntax.");
  }
}


function updateAttachedFileInfo() {
  if (!attachedFile) {
    attachedFileInfo.innerHTML = "";
    return;
  }

  attachedFileInfo.innerHTML = `
    <div class="sb-attachment">
      <div class="sb-attachment-row">
        <span class="sb-attachment-icon">📎</span>
        <span class="sb-attachment-name">${escapeHtml(attachedFile.name)}</span>
      </div>
      <button type="button" class="sb-attachment-remove remove-attachment">Remove</button>
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
  fileDropArea.classList.add("sb-drop-hover");
}

function onFileDragLeave() {
  fileDropArea.classList.remove("sb-drop-hover");
}

function onFileDrop(event) {
  event.preventDefault();
  fileDropArea.classList.remove("sb-drop-hover");

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

  const attachment = sanitizeAttachment({
    path: file.path,
    name: file.name || file.path.split(/[/\\]/).pop() || "attached-file"
  });

  if (!attachment) {
    showError("This file path is not allowed for security reasons.");
    return;
  }

  attachedFile = attachment;
  updateAttachedFileInfo();
  clearError();
}

function onContainerClick(event) {
  if (event.target === modalContainer) {
    closeEditor();
  }
}

function onDocumentKeydown(event) {
  if (!modalContainer || modalContainer.classList.contains("sb-hidden")) return;

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
  errorBanner.classList.remove("sb-hidden");
}

function clearError() {
  if (!errorBanner) return;
  errorBanner.textContent = "";
  errorBanner.classList.add("sb-hidden");
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
