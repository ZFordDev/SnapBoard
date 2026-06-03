const BLOCKED_PATH_PATTERNS = [
  /^\\\\/, // UNC network share
  /^~(?=$|[\/])/, // home shorthand
  /^[A-Za-z]:[\\/](?:Windows|Program Files|Program Files \(x86\)|ProgramData|Users[\\/](?:Default|Public|All Users))/i,
  /^\/(?:etc|bin|usr|var|root|sbin|dev|proc|sys|boot|lib|lib64|lost\+found)(?:\b|\/)/i,
  /^\/System(?:\/|$)/,
];

function containsPathTraversal(value) {
  return /(^|[\\/])\.\.([\\/]|$)/.test(value);
}

function isAbsolutePath(value) {
  if (typeof value !== "string") return false;
  return /^[A-Za-z]:[\\/]/.test(value) || value.startsWith("/");
}

export function isSafeAttachmentPath(filePath) {
  if (typeof filePath !== "string") return false;
  const trimmed = filePath.trim();
  if (!trimmed || trimmed.includes("\0")) return false;
  if (!isAbsolutePath(trimmed)) return false;
  if (containsPathTraversal(trimmed)) return false;

  return !BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function sanitizeAttachment(file) {
  if (!file || typeof file.path !== "string") return null;

  const pathValue = file.path.trim();
  if (!isSafeAttachmentPath(pathValue)) return null;

  const rawName = typeof file.name === "string" ? file.name.trim() : "";
  const safeName = rawName.replace(/[\r\n<>]/g, "").trim() || pathValue.split(/[/\\]/).pop() || "attached-file";

  return {
    path: pathValue,
    name: safeName
  };
}
