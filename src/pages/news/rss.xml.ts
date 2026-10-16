import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getArticles } from '../../lib/news';
import { getCategory } from '../../data/news';

export async function GET(context: APIContext) {
  const articles = await getArticles();
  return rss({
    title: 'Trekking Partners Nepal – News & updates',
    description: 'Nepal trekking news: trail conditions, permit rules, new routes and tourism updates.',
    site: context.site!,
    trailingSlash: true,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.date,
      link: `/news/${a.id}/`,
      categories: [getCategory(a.data.category).name],
    })),
  });
}
