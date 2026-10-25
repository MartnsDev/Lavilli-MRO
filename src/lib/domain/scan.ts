export function scanDestination(value: string, origin: string): string | null {
  const code = value.trim().slice(0, 500);
  if (!code) return null;
  try {
    const url = new URL(code, origin);
    if (
      url.origin === origin &&
      /^\/records\/(tools|tool_kits|locations|part_instances)\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(
        url.pathname,
      )
    )
      return url.pathname;
  } catch {}
  return "/search?q=" + encodeURIComponent(code.slice(0, 100));
}
