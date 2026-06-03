const ALLOWED_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
  "span",
  "div",
  "small"
]);

const ALLOWED_ATTRIBUTES = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title"],
  code: ["class"],
  pre: ["class"]
};

const URL_ATTRIBUTES = new Set(["href", "src"]);
const SAFE_URL_PROTOCOLS = ["http:", "https:", "mailto:", "tel:", "#", "/"];

function isSafeUrl(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith("#") || trimmed.startsWith("/")) return true;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    const protocol = trimmed.slice(0, trimmed.indexOf(":") + 1).toLowerCase();
    return SAFE_URL_PROTOCOLS.includes(protocol);
  }

  return false;
}

function sanitizeNode(node) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const tagName = node.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) {
      node.remove();
      return;
    }

    const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || [];
    for (const attr of [...node.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value;

      if (!allowedAttrs.includes(name) || name.startsWith("on")) {
        node.removeAttribute(attr.name);
        continue;
      }

      if (URL_ATTRIBUTES.has(name) && !isSafeUrl(value)) {
        node.removeAttribute(attr.name);
        continue;
      }

      if (tagName === "a") {
        node.setAttribute("rel", "noreferrer noopener");
        node.setAttribute("target", "_blank");
      }
    }
  }

  const children = [...node.childNodes];
  for (const child of children) {
    sanitizeNode(child);
  }
}

export function sanitizeHTML(dirtyHtml) {
  const template = document.createElement("template");
  template.innerHTML = String(dirtyHtml || "");
  sanitizeNode(template.content);
  return template.innerHTML;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
