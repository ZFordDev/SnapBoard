// src/utils/dom.js

// Shortcuts
export const byId = (id) => document.getElementById(id);
export const qs = (sel, parent = document) => parent.querySelector(sel);
export const qsa = (sel, parent = document) => [...parent.querySelectorAll(sel)];

// Create element with optional classes + attributes
export function el(tag, options = {}) {
  const node = document.createElement(tag);

  if (options.class) node.className = options.class;
  if (options.text) node.textContent = options.text;

  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      node.setAttribute(key, value);
    }
  }

  return node;
}

// Remove all children
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

// Event helper (SnapDock style)
export function on(node, event, handler) {
  node.addEventListener(event, handler);
  return () => node.removeEventListener(event, handler);
}

// Delegate events (for dynamic UI)
export function delegate(parent, selector, event, handler) {
  parent.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) {
      handler(e, target);
    }
  });
}