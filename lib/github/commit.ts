/**
 * GitHub API helper: atomic multi-file commit.
 * Uses Git Data API (refs, trees, commits) — single commit for all files.
 *
 * Required env vars:
 *   GITHUB_TOKEN — Personal Access Token with `contents:write` (fine-grained) or `repo` (classic)
 *   GITHUB_REPO  — "owner/name" e.g. "Dianov063/LedgerHound"
 *   GITHUB_BRANCH (optional, default 'main')
 */

const API = 'https://api.github.com';

interface FileChange {
  path: string;          // repo-relative path
  content: string;       // utf-8 file content (will be base64'd by us)
  mode?: '100644';       // default file mode
}

interface GitHubError {
  message: string;
  status?: number;
}

function repo(): string {
  const r = process.env.GITHUB_REPO;
  if (!r) throw new Error('GITHUB_REPO env var not set (expected "owner/name")');
  return r;
}

function token(): string {
  const t = process.env.GITHUB_TOKEN;
  if (!t) throw new Error('GITHUB_TOKEN env var not set');
  return t;
}

function branch(): string {
  return process.env.GITHUB_BRANCH || 'main';
}

async function gh<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${path} failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Fetch the raw content of a file from the repo's default branch.
 * Returns null if the file does not exist.
 */
export async function getFileContent(path: string): Promise<string | null> {
  try {
    const r = await gh<{ content: string; encoding: string }>(
      `/repos/${repo()}/contents/${encodeURIComponent(path)}?ref=${branch()}`,
    );
    if (r.encoding === 'base64') {
      return Buffer.from(r.content, 'base64').toString('utf-8');
    }
    return r.content;
  } catch (err: any) {
    if (err.message?.includes('404')) return null;
    throw err;
  }
}

/**
 * Atomically commit a set of files to the repo.
 * Creates one commit covering all files. Returns the commit SHA + URL.
 */
export async function commitFiles({
  files,
  message,
  authorName = 'LedgerHound Blog Agent',
  authorEmail = 'blog-agent@ledgerhound.vip',
}: {
  files: FileChange[];
  message: string;
  authorName?: string;
  authorEmail?: string;
}): Promise<{ sha: string; url: string }> {
  const r = repo();
  const br = branch();

  // 1. Get current branch ref
  const ref = await gh<{ object: { sha: string } }>(`/repos/${r}/git/refs/heads/${br}`);
  const baseSha = ref.object.sha;

  // 2. Get base commit (to find base tree)
  const baseCommit = await gh<{ tree: { sha: string } }>(
    `/repos/${r}/git/commits/${baseSha}`,
  );
  const baseTreeSha = baseCommit.tree.sha;

  // 3. Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (f) => {
      const blob = await gh<{ sha: string }>(`/repos/${r}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({
          content: Buffer.from(f.content, 'utf-8').toString('base64'),
          encoding: 'base64',
        }),
      });
      return { path: f.path, sha: blob.sha, mode: f.mode || '100644' };
    }),
  );

  // 4. Create new tree
  const tree = await gh<{ sha: string }>(`/repos/${r}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: blobs.map((b) => ({
        path: b.path,
        mode: b.mode,
        type: 'blob',
        sha: b.sha,
      })),
    }),
  });

  // 5. Create commit
  const commit = await gh<{ sha: string; html_url: string }>(`/repos/${r}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [baseSha],
      author: { name: authorName, email: authorEmail },
    }),
  });

  // 6. Update branch ref to point at new commit
  await gh(`/repos/${r}/git/refs/heads/${br}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });

  return { sha: commit.sha, url: commit.html_url };
}
