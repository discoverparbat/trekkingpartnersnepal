import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://trekkingpartnersnepal.com',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      // keep private pages out of the sitemap
      filter: (page) => !/\/(admin|login|account|post|trekker|departure|unsubscribe|find-partners\/new)\/$/.test(page),
    }),
  ],
});
