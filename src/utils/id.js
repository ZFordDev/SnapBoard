// src/utils/id.js

// Generate a short, collision-resistant ID
export function nanoid(size = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const array = new Uint8Array(size);
  crypto.getRandomValues(array);

  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}