export function getSafeCallbackUrl(): string {
  if (typeof window === "undefined") return "/";
  const raw = new URLSearchParams(window.location.search).get("callbackUrl");
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}
