import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const compatibilityPageUrl = new URL('../static/search/index.html', import.meta.url);

const runRedirect = async (href) => {
  const html = await readFile(compatibilityPageUrl, 'utf8');
  const script = html.match(/<script>(?<source>[\s\S]*?)<\/script>/u)?.groups.source;
  assert.ok(script, 'compatibility page must contain an inline redirect script');

  const link = {};
  let replacement;
  vm.runInNewContext(script, {
    URL,
    window: {
      location: {
        href,
        search: new URL(href).search,
        hash: new URL(href).hash,
        replace(value) {
          replacement = String(value);
        },
      },
    },
    document: {
      getElementById(id) {
        assert.equal(id, 'search-link');
        return link;
      },
    },
  });
  return {html, link: link.href, replacement};
};

test('provides a noindex trailing-slash search compatibility page', async () => {
  const {html} = await runRedirect('https://example.test/tego-arch/search/');
  assert.match(html, /<meta name="robots" content="noindex,follow">/u);
  assert.match(html, /<a id="search-link" href="\.\.\/search">/u);
});

test('redirect is relative to any deployment base and preserves query and hash', async () => {
  for (const [source, target] of [
    [
      'https://example.test/tego-arch/search/?q=CQRS#result',
      'https://example.test/tego-arch/search?q=CQRS#result',
    ],
    [
      'https://example.test/nested/base/search/?q=%E5%BE%AE%E5%89%8D%E7%AB%AF',
      'https://example.test/nested/base/search?q=%E5%BE%AE%E5%89%8D%E7%AB%AF',
    ],
  ]) {
    const result = await runRedirect(source);
    assert.equal(result.link, target);
    assert.equal(result.replacement, target);
  }
});

test('postbuild compatibility artifact preserves the initial hash throughout hydration', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'tego-search-route-'));
  try {
    await mkdir(path.join(directory, 'search'));
    await writeFile(
      path.join(directory, 'search.html'),
      '<!doctype html><html><head><meta name="robots" content="index,follow"><title>Search results</title></head><body><div id="__docusaurus">CQRS results</div></body></html>',
    );
    const {syncSearchRouteCompatibility} = await import(
      '../scripts/sync-search-route-compat.mjs'
    );
    await syncSearchRouteCompatibility(directory);

    const compatible = await readFile(path.join(directory, 'search', 'index.html'), 'utf8');
    assert.match(compatible, /<title>Search results<\/title>/u);
    assert.match(compatible, /CQRS results/u);
    assert.equal(
      compatible.match(/<meta name="robots" content="noindex,follow">/gu)?.length,
      1,
    );
    assert.doesNotMatch(compatible, /content="index,follow"/u);
    const script = compatible.match(
      /<script data-search-route-compat>(?<source>[\s\S]*?)<\/script>/u,
    )?.groups.source;
    assert.ok(script);

    let replacement;
    const location = new URL('https://example.test/tego-arch/search/?q=CQRS#result');
    const history = {
      replaceState(_state, _unused, value) {
        replacement = String(value);
        const next = new URL(replacement);
        location.pathname = next.pathname;
        location.search = next.search;
        location.hash = next.hash;
      },
    };
    let loadHandler;
    let queuedTask;
    vm.runInNewContext(script, {
      URL,
      window: {
        location,
        history,
        addEventListener(type, handler, options) {
          assert.equal(type, 'load');
          assert.equal(options?.once, true);
          loadHandler = handler;
        },
        setTimeout(handler, delay) {
          assert.equal(delay, 0);
          queuedTask = handler;
        },
      },
    });
    assert.equal(replacement, 'https://example.test/tego-arch/search?q=CQRS#result');

    history.replaceState(null, '', 'https://example.test/tego-arch/search?q=CQRS');
    assert.equal(replacement, 'https://example.test/tego-arch/search?q=CQRS#result');

    history.replaceState(null, '', 'https://example.test/tego-arch/search?q=CQRS');
    assert.equal(replacement, 'https://example.test/tego-arch/search?q=CQRS#result');

    assert.equal(typeof loadHandler, 'function');
    loadHandler();
    assert.equal(typeof queuedTask, 'function');
    queuedTask();

    history.replaceState(null, '', 'https://example.test/tego-arch/search?q=CQRS');
    assert.equal(replacement, 'https://example.test/tego-arch/search?q=CQRS');
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
