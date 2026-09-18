// Non-blocking side effects (notifications, rewards, cache writes) must not fail
// the request — but their failures should still show up in the server logs.
export function logBackgroundError(label: string) {
  return (error: unknown) => {
    console.error(`[background] ${label} failed:`, error);
  };
}
