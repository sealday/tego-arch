import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {readContentDocuments} from '../scripts/content-metadata.mjs';
import {
  extractExternalLinks,
  parseSourceLedger,
  validateSourceGovernance,
} from '../scripts/source-ledger.mjs';
import {
  validateInventoryLedgerConsistency,
  validateSourceLicenseInventory,
} from '../scripts/validate-source-license-inventory.mjs';

const inventoryPath = new URL('../docs/source-license-inventory.md', import.meta.url);
const ledgerPath = new URL('../data/source-ledger.json', import.meta.url);
const contentRoot = fileURLToPath(new URL('../content', import.meta.url));
const approvedMicrosoftLicenseEvidenceUrls = new Set([
  'https://github.com/microsoftdocs/architecture-center/blob/main/LICENSE',
  'https://github.com/microsoftdocs/architecture-center/blob/4fb4d75aa5ed8423caa0d6c35d40b32bbc3cc819/LICENSE',
  'https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/ef79621488119c618cd3ebeb8f81443f023cc452/LICENSE',
  'https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/f69851e7c8b27ca6e8983e7b7d91d35e99423a73/LICENSE',
  'https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/7b4bf26469bc45810c64406ad3cebdae4f60fb6b/LICENSE',
  'https://raw.githubusercontent.com/MicrosoftDocs/architecture-center/c8d425de181f581df8ec98953ec6cd5f1825f0ba/LICENSE',
  'https://github.com/dotnet/docs/blob/main/LICENSE',
  'https://raw.githubusercontent.com/dotnet/docs/a4303ce92aa169102f57793c84aae0603c75c3a3/LICENSE',
]);

async function governedData() {
  const [inventoryMarkdown, ledgerText, microFrontendsBody] = await Promise.all([
    readFile(inventoryPath, 'utf8'),
    readFile(ledgerPath, 'utf8'),
    readFile(
      new URL('../content/cases/micro-frontends-single-spa.mdx', import.meta.url),
      'utf8',
    ),
  ]);
  return {
    inventory: validateSourceLicenseInventory(inventoryMarkdown, []),
    inventoryMarkdown,
    ledger: JSON.parse(ledgerText),
    microFrontendsBody,
  };
}

test('records all Kubernetes documentation families as CC-BY-4.0 from official footer evidence', async () => {
  const {inventory, ledger} = await governedData();
  const inventoryRows = inventory.entries.filter((entry) =>
    entry.source_family.startsWith('https://kubernetes.io/'));
  const ledgerSources = ledger.sources.filter((source) =>
    source.license_family_id.startsWith('https://kubernetes.io/'));

  assert.equal(inventoryRows.length, 8);
  assert.equal(ledgerSources.length, 8);
  for (const item of [...inventoryRows, ...ledgerSources]) {
    assert.equal(item.exact_license ?? item.license, 'CC-BY-4.0');
    assert.match(item.license_evidence_note, /official.*footer.*CC BY 4\.0/i);
  }
});

test('records every official-license family found by the systematic ARR audit', async () => {
  const {inventory} = await governedData();
  const expectedLicense = (family) => {
    if (family === 'github:cncf/curriculum') return 'CC-BY-4.0';
    if (family === 'https://arc42.org/') return 'CC-BY-SA-4.0';
    if (family === 'https://c4model.com/') return 'CC-BY-4.0';
    if (family === 'https://sre.google/workbook/table-of-contents/') {
      return 'CC-BY-NC-ND-4.0';
    }
    if (family === 'https://www.cosmicpython.com/book/preface.html') {
      return 'LicenseRef-CC-BY-NC-ND-Unversioned';
    }
    if (family === 'https://modelcontextprotocol.io/specification/2025-06-18/architecture') {
      return 'LicenseRef-MCP-Specification-Transition';
    }
    if (family === 'https://modelcontextprotocol.io/docs/getting-started/intro') {
      return 'CC-BY-4.0';
    }
    if (family.startsWith('https://learn.microsoft.com/')) return 'CC-BY-4.0';
    if (family === 'https://google.github.io/adk-docs/agents/multi-agents/') {
      return 'Apache-2.0';
    }
    const host = family.startsWith('https://') ? new URL(family).hostname : '';
    if (host === 'developers.cloudflare.com' || host === 'docs.ros.org') {
      return 'CC-BY-4.0';
    }
    if (
      [
        'a2a-protocol.org',
        'adk.dev',
        'aigateway.envoyproxy.io',
        'design.ros2.org',
        'kafka.apache.org',
        'kubeedge.io',
        'release-1-20.docs.kubeedge.io',
        'www.erlang.org',
      ].includes(host)
    ) {
      return 'Apache-2.0';
    }
    if (
      [
        'developer.konghq.com',
        'docs.langchain.com',
        'docs.temporal.io',
        'openai.github.io',
      ].includes(host)
    ) {
      return 'MIT';
    }
    if (host === 'kubernetes.io') return 'CC-BY-4.0';
    return null;
  };

  const corrected = inventory.entries
    .map((entry) => [entry, expectedLicense(entry.source_family)])
    .filter(([, expected]) => expected !== null);
  assert.equal(corrected.length, 124);
  for (const [entry, expected] of corrected) {
    assert.equal(entry.exact_license, expected, entry.source_family);
  }
});

test('records the known Micro Frontends author and publication date consistently', async () => {
  const {inventory, ledger, microFrontendsBody} = await governedData();
  const family = 'https://martinfowler.com/articles/micro-frontends.html';
  const inventoryRow = inventory.entries.find((entry) => entry.source_family === family);
  const source = ledger.sources.find((entry) => entry.license_family_id === family);

  assert.equal(inventoryRow.author_or_org, 'Cam Jackson');
  assert.equal(source.author_or_org, 'Cam Jackson');
  assert.equal(source.published_at, '2019-06-19');
  assert.match(
    microFrontendsBody,
    /Cam Jackson, Micro Frontends.*发布于 2019-06-19/s,
  );
});

test('records all Microsoft Learn families as CC-BY-4.0 from official license evidence', async () => {
  const {inventory, ledger} = await governedData();
  const rows = inventory.entries.filter((entry) =>
    entry.source_family.startsWith('https://learn.microsoft.com/'));
  const sources = ledger.sources.filter((source) =>
    source.license_family_id.startsWith('https://learn.microsoft.com/'));

  assert.equal(rows.length, 9);
  assert.equal(sources.length, 13);
  for (const item of [...rows, ...sources]) {
    assert.equal(item.exact_license ?? item.license, 'CC-BY-4.0');
    assert.equal(
      approvedMicrosoftLicenseEvidenceUrls.has(item.license_evidence_url),
      true,
      item.license_evidence_url,
    );
  }
});

test('rejects unapproved Architecture Center license commit URLs', () => {
  for (const commit of [
    '0000000000000000000000000000000000000000',
    'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
  ]) {
    assert.equal(
      approvedMicrosoftLicenseEvidenceUrls.has(
        `https://github.com/microsoftdocs/architecture-center/blob/${commit}/LICENSE`,
      ),
      false,
      commit,
    );
  }
});

test('uses policy-compatible transports for known access-controlled sources', async () => {
  const {ledger} = await governedData();
  const byId = new Map(ledger.sources.map((source) => [source.id, source]));

  const medium = byId.get('src-docs-28997e2e106b');
  assert.equal(medium.link_policy, 'auth-required');
  assert.equal(
    medium.expected_final_approval_note,
    'Repeated live checks on 2026-08-06 returned HTTP 403 from the official Medium page; accepted as an auth-required transport baseline for manual access.',
  );

  const teamTopologies = byId.get(
    'src-team-topologies-organization-dynamics-2020',
  );
  const expectedTransport =
    'https://landing.teamtopologies.com/organization-dynamics-with-team-topologies';
  assert.equal(teamTopologies.transport_locator, expectedTransport);
  assert.equal(teamTopologies.expected_final_transport_locator, expectedTransport);
  assert.equal(teamTopologies.expected_final_approved_at, '2026-08-06');
  assert.match(
    teamTopologies.expected_final_approval_note,
    /official Team Topologies landing page.*HTTP 200.*2026-08-06/u,
  );
  assert.deepEqual(ledger.superseded_transports, [
    {
      source_ids: ['src-team-topologies-organization-dynamics-2020'],
      transport_locator:
        'https://teamtopologies.com/all-mini-books/mini-book-organization-dynamics-with-team-topologies',
      replacement_transport_locator: expectedTransport,
      superseded_at: '2026-08-06T16:59:31.495Z',
      reason:
        'The old Squarespace transport repeatedly reset Node.js connections; the reviewed official landing transport replaces it.',
      result_sha256:
        '80676dc47aadfa1746abee2e823521043cd0e6b8978db2efeecea1425a6e5285',
    },
  ]);

  const mutated = structuredClone(ledger);
  mutated.superseded_transports[0].result_sha256 = 'not-a-sha';
  assert.match(
    parseSourceLedger(mutated).errors.join('\n'),
    /result_sha256/u,
  );
});

test('validates the seven Batch 4 license families against mutation-sensitive evidence rules', async () => {
  const {inventory, inventoryMarkdown, ledger} = await governedData();
  const batchSourceIds = [
    'src-objectmentor-ocp-1996',
    'src-objectmentor-isp-1996',
    'src-nilsson-ddd-patterns-2006',
    'src-ms-ddd-oriented-microservice-persistence-ignorance',
    'src-ms-infrastructure-persistence-layer-design',
    'src-larman-applying-uml-patterns-3e-2004',
    'src-larman-applying-uml-patterns-author-page',
  ];
  const batchSources = batchSourceIds.map((id) => {
    const source = ledger.sources.find((entry) => entry.id === id);
    assert.ok(source, `${id} must exist in the real source ledger`);
    return source;
  });
  const batchFamilies = new Set(
    batchSources.map((source) => source.license_family_id),
  );
  const batchEntries = inventory.entries.filter((entry) =>
    batchFamilies.has(entry.source_family));
  assert.equal(batchEntries.length, 7);

  const inventoryLines = inventoryMarkdown.split(/\r?\n/u);
  const headerIndex = inventoryLines.findIndex((line) =>
    line.startsWith('| source_family |'));
  assert.notEqual(headerIndex, -1);
  const batchRows = inventoryLines.filter((line) =>
    [...batchFamilies].some((family) => line.startsWith(`| ${family} |`)));
  assert.equal(batchRows.length, 7);
  const batchInventory = [
    inventoryLines[headerIndex],
    inventoryLines[headerIndex + 1],
    ...batchRows,
  ].join('\n');
  const candidateUrls = batchEntries.flatMap((entry) => entry.current_urls);
  const validated = validateSourceLicenseInventory(
    batchInventory,
    candidateUrls,
  );
  assert.deepEqual(validated.errors, []);

  const arrSources = batchSources.filter(
    (source) => source.license === 'LicenseRef-All-Rights-Reserved',
  );
  assert.equal(arrSources.length, 5);
  const arrNotes = arrSources.map((source) => {
    const entry = batchEntries.find(
      (candidate) => candidate.source_family === source.license_family_id,
    );
    assert.ok(entry, `${source.id} must have an inventory row`);
    assert.match(
      entry.license_evidence_note,
      new RegExp(source.author_or_org.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'),
    );
    assert.match(
      entry.license_evidence_note,
      new RegExp(entry.license_evidence_url.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'),
    );
    return entry.license_evidence_note;
  });
  assert.equal(new Set(arrNotes).size, 5);

  const microsoftSources = batchSources.filter((source) =>
    source.id.startsWith('src-ms-'));
  assert.equal(microsoftSources.length, 2);
  for (const source of microsoftSources) {
    const entry = batchEntries.find(
      (candidate) => candidate.source_family === source.license_family_id,
    );
    assert.ok(entry, `${source.id} must have an inventory row`);
    assert.equal(
      source.license_evidence_url,
      'https://github.com/dotnet/docs/blob/main/LICENSE',
    );
    assert.equal(
      entry.license_evidence_url,
      'https://github.com/dotnet/docs/blob/main/LICENSE',
    );
    assert.notEqual(
      source.license_evidence_url,
      'https://learn.microsoft.com/en-us/legal/termsofuse',
    );
    assert.notEqual(
      entry.license_evidence_url,
      'https://learn.microsoft.com/en-us/legal/termsofuse',
    );
  }
});

test('keeps Yjs documentation conservative because license.md only licenses Yjs software', async () => {
  const {inventory, ledger} = await governedData();
  const rows = inventory.entries.filter((entry) =>
    entry.source_family.startsWith('https://docs.yjs.dev'));
  const sources = ledger.sources.filter((source) =>
    source.license_family_id.startsWith('https://docs.yjs.dev'));

  assert.equal(rows.length, 8);
  assert.equal(sources.length, 8);
  for (const item of [...rows, ...sources]) {
    assert.equal(
      item.exact_license ?? item.license,
      'LicenseRef-All-Rights-Reserved',
    );
    assert.equal(
      item.license_evidence_url,
      'https://github.com/yjs/docs/blob/main/license.md',
    );
    assert.match(
      item.license_evidence_note,
      /license\.md.*Yjs software.*does not clearly license.*documentation text/i,
    );
    assert.doesNotMatch(item.license_evidence_note, /no reusable license notice.*found/i);
  }
});

test('uses official ISO committee work pages as transport without changing governed identities or rights', async () => {
  const {ledger} = await governedData();
  const expected = new Map([
    [
      'src-iso-42010-2022',
      {
        canonical: 'https://www.iso.org/standard/74393.html',
        transport: 'https://committee.iso.org/standard/74393.html',
        title:
          'ISO/IEC/IEEE 42010:2022 — Software, systems and enterprise — Architecture description',
        copyrightPolicy: 'facts-and-short-quotation',
        usageBoundary:
          'Supports public boundaries for architecture descriptions; it does not specify architecting methods, notations, tools, formats, or architecture fitness.',
      },
    ],
    [
      'src-iso-11f3b103e932',
      {
        canonical: 'https://www.iso.org/standard/78176.html',
        transport: 'https://committee.iso.org/standard/78176.html',
        title: 'ISO/IEC 25010:2023',
        copyrightPolicy: 'facts-and-short-quotation',
        usageBoundary:
          'Defines the cited protocol or standard contract in “ISO/IEC 25010:2023”; it does not demonstrate implementation conformance or production fitness.',
      },
    ],
  ]);

  for (const [id, identity] of expected) {
    const source = ledger.sources.find((entry) => entry.id === id);
    assert.ok(source, id);
    assert.equal(source.canonical_locator, identity.canonical, id);
    assert.equal(source.transport_locator, identity.transport, id);
    assert.equal(
      source.expected_final_transport_locator,
      identity.transport,
      id,
    );
    assert.equal(source.expected_final_approved_at, '2026-07-28', id);
    assert.match(
      source.expected_final_approval_note,
      /repeated Cloudflare HTTP 403.*equivalent official ISO committee work page.*old www transport cache history.*transport-key migration/i,
      id,
    );
    assert.equal(source.title, identity.title, id);
    assert.equal(source.license, 'LicenseRef-Proprietary-Standard', id);
    assert.equal(source.copyright_policy, identity.copyrightPolicy, id);
    assert.equal(source.usage_boundary, identity.usageBoundary, id);
  }
});

test('records LiteLLM documentation families as MIT from the official docs repository', async () => {
  const {inventory, ledger} = await governedData();
  const rows = inventory.entries.filter((entry) =>
    entry.source_family.startsWith('https://docs.litellm.ai'));
  const sources = ledger.sources.filter((source) =>
    source.license_family_id.startsWith('https://docs.litellm.ai'));
  assert.equal(rows.length, 6);
  assert.equal(sources.length, 6);
  for (const item of [...rows, ...sources]) {
    assert.equal(item.exact_license ?? item.license, 'MIT');
    assert.equal(
      item.license_evidence_url,
      'https://github.com/BerriAI/litellm-docs/blob/main/LICENSE',
    );
  }
});

test('records the New API documentation repository and live-footer license conflict', async () => {
  const {inventory, ledger} = await governedData();
  const rows = inventory.entries.filter((entry) =>
    entry.source_family.startsWith('https://docs.newapi.pro'));
  const sources = ledger.sources.filter((source) =>
    source.license_family_id.startsWith('https://docs.newapi.pro'));
  assert.equal(rows.length, 2);
  assert.equal(sources.length, 2);
  for (const item of [...rows, ...sources]) {
    assert.equal(
      item.exact_license ?? item.license,
      'LicenseRef-New-API-Docs-License-Conflict',
    );
    assert.equal(
      item.license_evidence_url,
      'https://github.com/QuantumNous/new-api-docs-v1/blob/main/LICENSE',
    );
    assert.match(
      item.license_evidence_note,
      /(?:content\/docs.*CC0-1\.0|CC0-1\.0.*content\/docs)/i,
    );
    assert.match(item.license_evidence_note, /live.*footer.*All Rights Reserved/i);
    assert.match(item.license_scope ?? item.scope_exclusions, /no adaptation/i);
    assert.doesNotMatch(item.license_evidence_note, /no reusable license notice.*found/i);
  }
});

test('describes ros2 repository scope without claiming a nonexistent repository-wide LICENSE', async () => {
  const {inventory, ledger} = await governedData();
  const row = inventory.entries.find((entry) => entry.source_family === 'github:ros2/ros2');
  const sources = ledger.sources.filter((source) => source.license_family_id === 'github:ros2/ros2');
  assert.equal(sources.length, 3);
  assert.match(row.license_evidence_note, /no single repository-wide LICENSE/i);
  assert.match(row.scope_exclusions, /component repositories.*excluded/i);
  assert.doesNotMatch(row.scope_exclusions, /covered by the evidenced LICENSE/i);
  for (const source of sources) {
    assert.equal(source.license_evidence_note, row.license_evidence_note);
    assert.equal(source.license_scope, row.scope_exclusions);
  }
});

test('keeps the migration inventory snapshot aligned with runtime ledger authority', async () => {
  const {inventory, ledger} = await governedData();
  const consistency = validateInventoryLedgerConsistency(inventory.entries, ledger.sources);
  assert.deepEqual(consistency.errors, []);
});

test('projects one visible governed primary source for every published learning path', async () => {
  const [documents, ledgerText] = await Promise.all([
    readContentDocuments(contentRoot),
    readFile(ledgerPath, 'utf8'),
  ]);
  const parsed = parseSourceLedger(JSON.parse(ledgerText));
  assert.deepEqual(parsed.errors, []);
  const governed = validateSourceGovernance(documents, parsed.ledger);
  assert.deepEqual(governed.errors, []);

  const sourceByUrl = new Map(
    parsed.ledger.sources.map((source) => [source.canonical_locator, source]),
  );
  const pathDocuments = documents.filter(({file}) =>
    /^paths\/\d{2}-.+\.mdx$/.test(file));
  assert.equal(pathDocuments.length, 10);
  for (const document of pathDocuments) {
    const projected = governed.primarySourcesByFile.get(document.file);
    assert.ok(projected?.length > 0, `${document.file} primary source`);
    const visible = new Set(extractExternalLinks(document));
    const ledgerEntry = parsed.ledger.documents[
      path.posix.join('content', document.file)
    ];
    for (const url of projected) {
      assert.ok(visible.has(url), `${document.file}: ${url} must be visible`);
      const citation = ledgerEntry.citations.find(
        (entry) => entry.citation_url === url && entry.manifest_primary,
      );
      assert.ok(citation, `${document.file}: ${url} citation`);
      const source = parsed.ledger.sources.find(
        (entry) => entry.id === citation.source_id,
      );
      assert.ok(sourceByUrl.has(source.canonical_locator));
      assert.ok(['primary', 'first-party'].includes(source.tier));
      assert.notEqual(source.source_kind, 'community-index');
      assert.ok(
        citation.roles.some((role) =>
          [
            'definition',
            'method',
            'runtime-fact',
            'case-evidence',
            'implementation',
          ].includes(role)),
      );
      assert.notEqual(citation.usage_mode, 'navigation-only');
    }
  }
});
