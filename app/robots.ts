import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /_next/ stays open: Google needs its CSS and JS to render the pages.
        disallow: ['/api/'],
      },
    ],
    sitemap: 'https://www.ledgerhound.vip/sitemap.xml',
    host: 'https://www.ledgerhound.vip',
  };
}
