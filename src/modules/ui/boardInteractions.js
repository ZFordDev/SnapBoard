// boardInteractions.js
// setup click handlers for rename/delete actions, using custom prompt dialog
import * as state from './boardState.js';

// simple async prompt modal
export function showPrompt(message, defaultValue = '') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    const box = document.createElement('div');
    box.className = 'bg-white rounded-lg p-4 w-80';
    box.innerHTML = `
      <div class="mb-2">${message}</div>
      <input type="text" class="w-full border p-1 mb-2" value="${defaultValue.replace(/"/g,'&quot;')}" />
      <div class="flex justify-end gap-2">
        <button class="cancel px-3 py-1">Cancel</button>
        <button class="ok px-3 py-1 bg-blue-500 text-white rounded">OK</button>
      </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    const input = box.querySelector('input');
    input.focus();
    box.querySelector('.ok').addEventListener('click', () => {
      cleanup();
      resolve(input.value);
    });
    box.querySelector('.cancel').addEventListener('click', () => {
      cleanup();
      resolve(null);
    });
    function cleanup() {
      document.body.removeChild(overlay);
    }
  });
}

export function setupColumnInteractions() {
  document.querySelectorAll('.column-header').forEach(header => {
    const colId = parseInt(header.getAttribute('data-col-id'));
    header.addEventListener('dblclick', async () => {
      const newTitle = await showPrompt('Column title:', header.textContent);
      if (newTitle) {
        await state.renameColumn(colId, newTitle);
        location.reload();
      }
    });
    // delete button is sibling of header text
    const delBtn = header.parentElement.querySelector('.delete-column');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (confirm('Delete this column?')) {
          await state.deleteColumn(colId);
          location.reload();
        }
      });
    }
  });
}

export function setupCardInteractions() {
  document.querySelectorAll('.card').forEach(cardEl => {
    const cardId = cardEl.id;
    cardEl.addEventListener('dblclick', async () => {
      const current = cardEl.querySelector('p').textContent;
      const newText = await showPrompt('Edit card text:', current);
      if (newText && newText !== current) {
        await state.renameCard(cardId, newText);
        location.reload();
      }
    });
    const del = cardEl.querySelector('.delete-card');
    if (del) {
      del.addEventListener('click', async e => {
        e.stopPropagation();
        if (confirm('Delete this card?')) {
          await state.deleteCard(cardId);
          location.reload();
        }
      });
    }
  });
}
