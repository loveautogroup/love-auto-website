/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://loveautogroup.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
    ],
    additionalSitemaps: [
      'https://loveautogroup.com/sitemap-vehicles.xml',
    ],
  },
  exclude: ['/api/*', '/admin/*'],
  generateIndexSitemap: true,
  changefreq: 'daily',
  priority: 0.7,
};
