import { createSitemapHandler } from "../server/sitemap.js";
export default {
  fetch(request: Request) {
    return createSitemapHandler(process.env)(request);
  },
};
