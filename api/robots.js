export default async () => {
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /search?*
Allow: /sitemap.xml
Allow: /sitemap-*.xml

Sitemap: https://yourdomain.com/sitemap.xml
Sitemap: https://yourdomain.com/sitemap-1.xml`;

  return new Response(robots, {
    headers: { 'Content-Type': 'text/plain' }
  });
};