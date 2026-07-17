/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // CANONICAL DOMAIN: www.loveautogroup.net (matches robots.ts host, every
  // page canonical, and the schema.org URLs). loveautogroup.com is NOT ours —
  // it's parked for sale at GoDaddy; this config was generating a sitemap
  // full of a stranger's domain. Found 2026-07-17 during the Phase D
  // mobile view-counts verification.
  siteUrl: 'https://www.loveautogroup.net',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/admin/'] },
    ],
    additionalSitemaps: [
      'https://www.loveautogroup.net/sitemap-vehicles.xml',
    ],
  },
  exclude: ['/api/*', '/admin/*'],
  generateIndexSitemap: true,
  changefreq: 'daily',
  priority: 0.7,
};
