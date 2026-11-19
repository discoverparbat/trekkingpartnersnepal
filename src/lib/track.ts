// Google Analytics events for the actions that matter on TPN (added 19 Nov 2026).
// Mark post_trek and message_reply as key events in GA4 (Admin → Events) once they've fired.
//   post_trek      a member publishes a partner post
//   send_message   a member sends a private message in a chat they started
//   message_reply  a member answers a chat someone else started (the match actually working)
//   reply_post     a member replies publicly under a partner post
export function track(name: string, params: Record<string, unknown> = {}) {
  try { (window as any).gtag?.('event', name, params); } catch { /* analytics must never break the page */ }
}
