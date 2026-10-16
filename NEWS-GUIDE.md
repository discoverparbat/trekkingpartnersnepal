# News & updates: setup and how to publish

Articles are written at **/admin/ → News** and stored in Supabase (table `news`).
Each article becomes a pre-built page at `/news/<web-address>/`, which is best for Google.
After you save, Supabase tells Cloudflare to rebuild the site; the change is live in about 2 minutes.

## One-time setup (about 10 minutes)

### 1. Create the news table
Supabase → SQL Editor → New query → paste all of `supabase/update-7-news.sql` → Run.
This creates the `news` table, a public `news` photo bucket, and the two starter articles as drafts.

### 2. Create a Cloudflare deploy hook
Cloudflare dashboard → Workers & Pages → trekkingpartnersnepal → Settings → Builds →
Deploy hooks → Add deploy hook. Name: `news`, branch: `main` → Save. Copy the URL it shows
(starts with `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/...`).
Keep this URL private: anyone with it can trigger rebuilds.

### 3. Connect Supabase to the deploy hook
Supabase → Database → Webhooks (enable webhooks if asked) → Create a new hook:
- Name: `rebuild-site-on-news`
- Table: `news`
- Events: Insert, Update, Delete
- Type: HTTP Request, Method: POST, URL: the deploy hook URL from step 2
- Create webhook

Done. Every save, publish, unpublish or delete in /admin/ now rebuilds the site.

## Writing an article
1. /admin/ → News → **+ New article**
2. Headline, short summary (120–158 characters), topic, and tick the treks it's about
   (the article then also shows on those trek pages).
3. Optional cover photo: upload it, and it's resized automatically. Without one, the trek's region photo is used.
4. Write the article. Use the toolbar for headings, bold, links, lists, notes, photos and YouTube videos.
   Click **Preview** to see how it will look.
5. Tick **Publish on the website** and click Save. Leave it unticked to keep a private draft.

The byline "By Sameer Regmi, Discover Parbat" is added automatically (change "Written by" to use another name).

## Updating an article
Edit it, click **Mark as updated today**, and change the trail status if needed. Updating the same
article is better than writing a new one for an ongoing story, since the page keeps its Google ranking.
Avoid changing the web address of a published article.

## If something goes wrong
- **Article not showing after 5 minutes:** Cloudflare → Deployments. If no new build started,
  check the Supabase webhook (step 3). If a build failed, open it and read the error.
- **Build error "Could not load news from Supabase":** Supabase couldn't be reached during the build.
  The live site keeps working with the previous version. Click "Retry deployment" in Cloudflare.
