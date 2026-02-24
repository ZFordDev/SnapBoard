// Placeholder logic for now

// Close / Minimize buttons
document.getElementById('close-btn').addEventListener('click', () => {
  window.api.send('close-window');
});

document.getElementById('min-btn').addEventListener('click', () => {
  window.api.send('min-window');
});

// Slide-out placeholder (future)
function slideOut() {
  const panel = document.getElementById('panel');
  panel.style.transform = 'translateX(0)';
}

function slideIn() {
  const panel = document.getElementById('panel');
  panel.style.transform = 'translateX(-100%)';
}

// Future: update indicator
window.api.on('update-available', () => {
  console.log('Update available');
});

window.api.on('update-ready', () => {
  console.log('Update ready');
});
