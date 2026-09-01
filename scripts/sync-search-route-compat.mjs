import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const canonicalizeScript = `<script data-search-route-compat>
      const target = new URL(window.location.href);
      const preservedHash = target.hash;
      target.pathname = target.pathname.replace(/\\/+$/u, '');
      const nativeReplaceState = window.history.replaceState.bind(window.history);
      const protectedReplaceState = (state, unused, url) => {
        if (!preservedHash || url == null) {
          return nativeReplaceState(state, unused, url);
        }
        const next = new URL(String(url), window.location.href);
        if (next.pathname === target.pathname && !next.hash) {
          next.hash = preservedHash;
        }
        return nativeReplaceState(state, unused, next.href);
      };
      window.history.replaceState = protectedReplaceState;
      const restoreOptions = {capture: true};
      const restoreReplaceState = () => {
        if (window.history.replaceState === protectedReplaceState) {
          window.history.replaceState = nativeReplaceState;
        }
        window.removeEventListener('input', restoreReplaceState, restoreOptions);
        window.removeEventListener('change', restoreReplaceState, restoreOptions);
      };
      window.addEventListener('input', restoreReplaceState, restoreOptions);
      window.addEventListener('change', restoreReplaceState, restoreOptions);
      nativeReplaceState(null, '', target.href);
    </script>`;

const robotsDirective = '<meta name="robots" content="noindex,follow">';

export async function syncSearchRouteCompatibility(buildDir) {
  const canonicalPage = path.join(buildDir, 'search.html');
  const compatibilityPage = path.join(buildDir, 'search', 'index.html');
  const source = await readFile(canonicalPage, 'utf8');
  if (!source.includes('<head>')) {
    throw new Error('canonical search page has no <head> element');
  }

  const normalizedSource = source.replace(
    /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/giu,
    '',
  );
  const compatible = normalizedSource.replace(
    '<head>',
    `<head>${robotsDirective}${canonicalizeScript}`,
  );
  await mkdir(path.dirname(compatibilityPage), {recursive: true});
  await writeFile(compatibilityPage, compatible);
}

const isCli = process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isCli) {
  try {
    await syncSearchRouteCompatibility(path.resolve(process.argv[2] ?? 'build'));
  } catch (error) {
    process.stderr.write(`search-route-compat: ${error.message}\n`);
    process.exitCode = 1;
  }
}
