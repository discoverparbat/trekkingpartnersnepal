# Trekking Partners Nepal (Astro)

## Setup
```
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
```

## public/ folder
```
public/
├── images/        hero.jpg, region photos, and images/treks/ (one photo per trek)
├── _headers       security headers
├── _redirects     301s for treks that moved region
├── robots.txt     links both sitemaps (site + /community/sitemap.xml)
├── logo.jpg, favicon.ico, favicon-96x96.png, apple-touch-icon.png, web-app-manifest-*.png, site.webmanifest
```
Pages like the homepage, privacy, terms, 404, login and the sitemap are built by Astro –
don't put .html or sitemap files for them in public/.

If you change an image's file type, update its path in `src/data/regions.ts`.

## Where to edit
- `src/data/regions.ts` – the 7 regions (text + images)
- `src/data/treks.ts` – all treks; adding one creates its page automatically
- Fixed departures – add and edit them at /admin/ (stored in Supabase)
- `src/lib/supabase.ts` – Supabase URL and publishable key
- `src/data/community.ts` – Community topics, admin note types and the partner-request check
- `src/pages/privacy.astro`, `src/pages/terms.astro` – legal pages

## Cloudflare Pages settings
- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION` = `22`

## Supabase
Run `supabase/schema.sql` once in Supabase → SQL Editor. It creates the profiles, trips and comments tables with security rules.

Authentication → URL Configuration → Redirect URLs must include:
- https://trekkingpartnersnepal.com/login/
- http://localhost:4321/login/

## Notifications (update 8)
The bell in the header shows a welcome message on sign-up, a "your first post is live" message on a member's
first post, and replies on their posts or posts they replied on (grouped per post until read).
A welcome email and a first-post email are also sent.

1. Supabase → Edge Functions → deploy `supabase/functions/member-email/index.ts` as **member-email**,
   with the same settings as `reply-alert` (JWT verification **off**; it uses the existing `RESEND_API_KEY` secret).
2. Run `supabase/update-8-notifications.sql` in the SQL Editor (needs update 5 to have been run first).
3. Database → Replication (Publications): check that `notifications` is ticked under `supabase_realtime`
   so the bell updates live. Without it the bell still updates on every page load.

## Community (update 10)
Trek questions and answers at `/community/`, plus the pinned **Admin notes & trail updates** box
(also shown on the homepage under "On the trail right now").

1. Run `supabase/update-10-community.sql` in the SQL Editor (needs update 8 first). Until it's run,
   the Community pages and the homepage section show as empty.
2. That's it – no new Edge Function or secret.

How it works:
- Anyone can read questions and answers. Asking, answering and "Helpful" votes need a complete profile (banned members can't).
- The asker (or an admin) can mark one **best answer**. Answers from the admin account show as "Trekking Partners Nepal · Admin".
- Signed in as admin, the Community page shows **+ Add update** for admin notes (each one expires after the time you pick),
  and every question gets **Pin to top / Close answers / Move to Find partners / Delete**.
- **Move to Find partners** hides the question and sends the member a bell notification asking them to post on Find partners.
- The ask form warns members when their text looks like a partner request, before they publish.
- Reports on questions and answers appear in Admin → Moderation with the other reports.
- `functions/community/question/` writes each question and its answers into the page for Google (QAPage schema),
  and `functions/community/sitemap.xml.ts` lists every question at `/community/sitemap.xml` (linked from robots.txt).

### Trek alerts and trek questions (update 11)
- Run `supabase/update-11-note-treks.sql` once (after update 10).
- Admin notes can now be linked to one trek (the **Trek** field in "+ Add update"). A linked note also shows
  as a banner at the top of that trek's page and on its partner posts until it expires. Closures show in red.
- Every trek page has a "Questions about <trek>" box with the latest 3 questions and an "Ask about this trek" button.
  `/community/?trek=<slug>` lists all questions for one trek.

## Site announcements (update 12)
Run `supabase/update-12-announcements.sql` once (after update 10). It sends every member a 🔔 notification
about the new Community and trek alerts (only once, even if run again).

To send another announcement later, run this in the SQL Editor (the link must be a page on the site):
```sql
select public.announce('Headline (max 120 characters)', 'Short text (max 400 characters)', '/community/');
```
It returns how many members it was sent to. Banned members don't get it.

## Private member list (update 13)
Run `supabase/update-13-private-members.sql` once (after update 10). Afterwards nobody can download the
member list: profiles are looked up by id, at most 50 at a time, and only for members who already appear
on the site (a partner post, reply, question or answer). Members who haven't posted are hidden from others.
Emails were never public. It also clears Supabase's "Security Definer View" warning on `public_profiles`.

## Answer emails (update 14)
Emails the asker when their Community question gets an answer. One email per question until they've read
the answers on the site (more answers in between are grouped in the bell). Uses the same "reply emails"
setting and unsubscribe link as reply emails.

1. Supabase → Edge Functions → deploy `supabase/functions/answer-alert/index.ts` as **answer-alert**,
   with the same settings as `reply-alert` (JWT verification **off**; it uses the existing `RESEND_API_KEY` secret).
2. Run `supabase/update-14-answer-emails.sql` in the SQL Editor.

## New-question alerts (update 15)
Run `supabase/update-15-new-question-alerts.sql` once. Every admin gets a 🔔 when a member asks a
Community question (linking straight to the answer box), and Admin → Moderation lists unanswered questions.

## News and greeting emails (update 17)
Sends one-off emails (festival greetings, site news) to every member who hasn't turned them off. Each email
has a "Turn off news emails" link; reply and answer emails are not affected. Campaigns are written in
`supabase/functions/news-email/index.ts`, and nobody gets the same campaign twice.

1. Supabase → Edge Functions → deploy `supabase/functions/news-email/index.ts` as **news-email**,
   with the same settings as `reply-alert` (JWT verification **off**; it uses the existing `RESEND_API_KEY` secret).
2. Run `supabase/update-17-news-emails.sql` in the SQL Editor. Its last line sends the Vijaya Dashami 2083 email.
3. To send a future campaign: add it to `CAMPAIGNS` in the function, redeploy, then run
   `select public.send_news_email('campaign-name');`

## Private messages (updates 22 and 24)
One-to-one private messages between members, started from a partner post
(the **✉ Message** button on the post, or on any reply). The envelope in the header shows unread chats.

- Since update 24 messages are stored as text in `messages.body`, tied to the members' Google sign-in. Row-level
  security means only the two people in a chat can read it. No messages password, nothing to set up, and chats are
  on every device. Messages are on for every member with a complete profile.
- Messages sent before update 24 were end-to-end encrypted (`src/lib/e2e.ts`). They're restored once: automatically
  if a member opens Messages on a device that still has their old key, otherwise the inbox asks once for the old
  messages password. Either person in a chat can restore it for both (`restore_messages`); the encrypted copy is then
  cleared. Until then those messages show as "older message".
- A member can start chats with **5 new people per 24 hours** (replies unlimited). A 6th attempt is refused and every
  admin gets a ⚠️ bell alert (once per member per 12 hours).
- **Block** (both directions, silent) and **Report** in every chat. A report carries the last 20 messages (Admin → Moderation).
- Emails (Edge Function `message-alert`): at most one per chat every 3 hours, never with message text, only if the
  member hasn't read that chat in the last 5 minutes, and only with reply emails on (same unsubscribe link).
- If Resend refuses an email because a plan quota is reached, admins get a ⚠️ "Email limit reached" bell alert.

Setup (already applied to the live project on 1 Nov 2026):
1. Run `supabase/update-22-messages.sql` in the SQL Editor (needs updates 4, 5, 8, 10, 13).
2. Deploy `supabase/functions/message-alert/index.ts` as **message-alert** (JWT verification **off**; uses `RESEND_API_KEY`).
3. Run `supabase/update-24-messages-no-password.sql` (removes the messages password; applied 1 Nov 2026).

### Getting members ready for messages (update 23)
- "Turn on messages" nudges: a banner on Find partners and on the member's own posts (not dismissable on a brand-new
  post), and a Private messages card in My account. Dismissed banners stay hidden for 3 weeks (`src/lib/msgNudge.ts`).
- After setting up from a nudge, members are taken back to the page they came from (`/messages/?next=…`).
- Run `supabase/update-23-messages-ready.sql`: when someone turns on messages, everyone who was waiting to write to them
  gets a 🔔 "turned on messages – you can write now". (Applied to the live project on 1 Nov 2026.)

## From our Facebook group (update 26)
Partner requests from the Facebook group, re-written by the admin, shown next to member posts.

1. Run `supabase/update-26-group-posts.sql` in the SQL Editor. Until it's run, the site just shows no group posts.
2. Admin → **From FB group** → **+ Share a group post**: paste the link to the post in the group, pick the trek and dates,
   and write a short summary in your own words (no member names, photos or contact details).

How it works:
- The cards show on Find partners (with the same filters), on trek and region pages, and on the homepage
  when there are fewer than 4 member posts. They're marked "From our Facebook group · Shared by Trekking Partners Nepal".
- Clicking a card opens the original Facebook post, so people reply to the member there. There are no on-site replies or messages.
- Posts drop off the site after their dates pass, or when you **Close** or **Delete** them.
