const SITE_URL = 'https://www.ledgerhound.vip';
const INDEXNOW_KEY = '9c1c16c8e0a04d4ebfb7da9a39cc7a29';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

type SitemapUrl = {
  loc: string;
  lastmod?: string;
};

function readTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`, 'i'));
  return match?.[1]?.trim();
}

function parseSitemap(xml: string): SitemapUrl[] {
  const entries = xml.match(/<url>[\s\S]*?<\/url>/gi) || [];
  return entries
    .map((entry) => ({
      loc: readTag(entry, 'loc') || '',
      lastmod: readTag(entry, 'lastmod'),
    }))
    .filter((entry) => entry.loc.startsWith(SITE_URL));
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function fetchSitemapUrls() {
  const response = await fetch(`${SITE_URL}/sitemap.xml`);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  return parseSitemap(await response.text());
}

async function submitUrls(urls: string[]) {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });

  if (!response.ok && response.status !== 202) {
    throw new Error(`IndexNow rejected batch: ${response.status} ${response.statusText}`);
  }
}

async function main() {
  const submittedSince = process.env.INDEXNOW_SINCE ? new Date(process.env.INDEXNOW_SINCE) : null;
  const allUrls = await fetchSitemapUrls();
  const urls = allUrls
    .filter(({ lastmod }) => !submittedSince || !lastmod || new Date(lastmod) >= submittedSince)
    .map(({ loc }) => loc);

  if (urls.length === 0) {
    console.log('No URLs to submit to IndexNow.');
    return;
  }

  for (const batch of chunk(urls, 10000)) {
    await submitUrls(batch);
    console.log(`Submitted ${batch.length} URLs to IndexNow.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
