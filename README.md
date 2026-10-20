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
