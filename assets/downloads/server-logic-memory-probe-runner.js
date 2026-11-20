(async () => {
  const BASE = window.PROBE_URL || '/_api/serverlogics/blogtest-memory-probe';
  const STORE = 'blogtestMemoryProbe';
  const PAUSE_MS = 300;
  const results = JSON.parse(localStorage.getItem(STORE) || '{}');
  const save = () => { localStorage.setItem(STORE, JSON.stringify(results)); window.probeResults = results; };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const html = await (await fetch('/_layout/tokenhtml')).text();
  const token = html.match(/value="([^"]+)"/)[1];
  let count = 0;

  const send = async (query, body = '{}', timeoutMs = 60000) => {
    await sleep(100);
    const started = performance.now();
    count++;
    try {
      const res = await fetch(`${BASE}?${new URLSearchParams(query)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', __RequestVerificationToken: token },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await res.text();
      window.probeStand = { count, query: JSON.stringify(query).slice(0, 90), status: res.status };
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        throw new Error(`HTTP ${res.status}`);
      }
      const header = res.headers.get('x-ms-user-trace');
      const trace = header ? new TextDecoder().decode(Uint8Array.from(atob(header), (c) => c.charCodeAt(0))) : '';
      const outcome = res.ok ? 'ok' : /memory limit/i.test(trace) ? 'limit' : res.status === 400 && !header ? 'noTrace' : `http${res.status}`;
      return { outcome, ms: Math.round(performance.now() - started), length: text.length };
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        return { outcome: 'hang', ms: Math.round(performance.now() - started), length: 0 };
      }
      throw error;
    }
  };

  const rate = async (query, body, runs, timeoutMs) => {
    const tally = { runs, ok: 0, limit: 0, noTrace: 0, hang: 0, other: 0, ms: [] };
    for (let run = 0; run < runs; run++) {
      const reply = await send(query, body, timeoutMs);
      if (reply.outcome in tally) tally[reply.outcome]++;
      else tally.other++;
      if (reply.outcome === 'ok') tally.ms.push(reply.ms);
    }
    tally.ms.sort((a, b) => a - b);
    tally.medianMs = tally.ms[Math.floor(tally.ms.length / 2)] ?? null;
    tally.ms = undefined;
    return tally;
  };

  const boundary = async (key, query, body, resolution = 32, max = 65536) => {
    if (results[key]) return results[key];
    window.probeSzenario = key;
    const pass = async (kb) => (await rate({ pauseMs: PAUSE_MS, ...query, ballastKb: kb }, body, 1)).ok === 1;
    const path = [];
    const test = async (kb) => { const ok = await pass(kb); path.push([kb, ok ? 1 : 0]); return ok; };
    let low = 0;
    let high = 1024;
    if (!(await test(0))) {
      results[key] = { safe: null, fails: 0, path };
      save();
      return results[key];
    }
    while (high <= max && (await test(high))) { low = high; high *= 2; }
    if (high > max) {
      results[key] = { safe: low, fails: null, path };
      save();
      return results[key];
    }
    while (high - low > resolution) {
      const middle = Math.floor((low + high) / 2);
      if (await test(middle)) low = middle;
      else high = middle;
    }
    const confirmSafe = await rate({ pauseMs: PAUSE_MS, ...query, ballastKb: low }, body, 3);
    const confirmFail = await rate({ pauseMs: PAUSE_MS, ...query, ballastKb: high }, body, 3);
    results[key] = { safe: low, fails: high, safeOk: confirmSafe.ok, failOk: confirmFail.ok, path };
    save();
    return results[key];
  };

  const once = async (key, work) => {
    if (results[key]) return results[key];
    window.probeSzenario = key;
    results[key] = await work();
    save();
    return results[key];
  };

  const id = (prefix, number) => `${prefix}0000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
  const filler = (length, seed) => (`Synthetic description ${seed} `).repeat(Math.ceil(length / 20)).slice(0, length);
  const catalog = (records, parents, attributesPerRecord = 37, marker = true) => {
    const parentList = [];
    for (let p = 0; p < parents; p++) {
      parentList.push({ id: id('e', p), name: `blogtest-parent-${p}`, description: filler(4300, p) + (marker ? ' •' : ''), recordIds: [] });
    }
    const recordList = [];
    const attributes = [];
    for (let r = 0; r < records; r++) {
      const parent = parentList[r % parents];
      const attributeIds = [];
      for (let a = 0; a < attributesPerRecord; a++) {
        const attributeId = id('c', r * 1000 + a);
        attributeIds.push(attributeId);
        attributes.push({ id: attributeId, recordid: id('a', r), name: `Attribute ${a}`, code: { value: 1, label: 'Yes' }, valueid: id('d', a), value: { id: id('d', a), code: `C-${a}`, name: filler(40, a) } });
      }
      parent.recordIds.push(id('a', r));
      recordList.push({ id: id('a', r), name: `blogtest-record-${r}`, parentid: parent.id, size: 100 + r, attributeIds, note: filler(300, r) });
    }
    return { parents: parentList, records: recordList, attributes };
  };
  const wire = (content) => {
    const Content = JSON.stringify(content);
    const body = JSON.stringify({ IsSucceeded: true, Content });
    return { text: JSON.stringify({ StatusCode: 200, IsSuccessStatusCode: true, Body: body }), contentKb: Math.round(Content.length / 1024) };
  };
  const shape = (kb) => {
    const records = Math.max(1, Math.round(kb / 14.5));
    return wire(catalog(records, Math.max(1, Math.round(records / 2))));
  };

  const stage = window.PROBE_STAGE || 'all';
  const prefix = window.PROBE_LABEL ? `${window.PROBE_LABEL} ` : '';

  await boundary(`${prefix}limit latin1 256`, { mode: 'ballast', ballastKind: 'latin1' });
  await boundary(`${prefix}limit twoByte 256`, { mode: 'ballast', ballastKind: 'twoByte' });
  await boundary(`${prefix}limit objects`, { mode: 'ballast', ballastKind: 'objects' });
  await boundary(`${prefix}limit latin1 64`, { mode: 'ballast', ballastKind: 'latin1', chunkKb: 64 });
  await boundary(`${prefix}limit latin1 single`, { mode: 'ballast', ballastKind: 'latin1', chunkKb: 65536 });
  await once(`${prefix}interval 8 MB`, async () => {
    const rows = [];
    for (const pauseMs of [0, 10, 50, 100, 200, 400]) {
      rows.push({ pauseMs, ...(await rate({ mode: 'ballast', ballastKb: 8192, pauseMs }, '{}', 10, 20000)) });
    }
    return rows;
  });

  const sizes = [100, 200, 300, 400, 500, 600, 800];
  for (const kb of sizes) {
    const { text, contentKb } = shape(kb);
    await once(`${prefix}catalog ${kb}`, async () => ({
      contentKb,
      wireKb: Math.round(text.length / 1024),
      withPause: await rate({ mode: 'catalog', log: 'none', pauseMs: PAUSE_MS, respond: 'off' }, text, 5),
      noPause: await rate({ mode: 'catalog', log: 'none', pauseMs: 0 }, text, 10),
      noPauseLog: await rate({ mode: 'catalog', log: 'on', pauseMs: 0 }, text, 10),
    }));
  }

  const probe = shape(250);
  await once(`${prefix}steps info`, async () => ({ contentKb: probe.contentKb, wireKb: Math.round(probe.text.length / 1024) }));
  for (const point of ['1-raw', '2-wrapper', '3-body', '4-content', '6-loaded', '7-logged']) {
    await boundary(`${prefix}step ${point}`, { mode: 'catalog', log: 'on', stopAt: point, ballastAt: 'stop', respond: 'off' }, probe.text);
  }
  for (const calls of [1, 2, 3, 4]) {
    await once(`${prefix}calls ${calls}`, async () => rate({ mode: 'catalog', log: 'none', calls, pauseMs: PAUSE_MS, respond: 'off' }, probe.text, 5));
  }
  await boundary(`${prefix}step 5-discarded`, { mode: 'catalog', log: 'none', calls: 2, stopAt: '5-discarded', ballastAt: 'stop', respond: 'off' }, probe.text);

  const edge = shape(window.PROBE_EDGE_KB || 450);
  await once(`${prefix}logging compare`, async () => {
    const on = { runs: 0, ok: 0, fail: 0, ms: [] };
    const built = { runs: 0, ok: 0, fail: 0, ms: [] };
    const none = { runs: 0, ok: 0, fail: 0, ms: [] };
    const series = [['on', on], ['off', built], ['none', none]];
    for (let run = 0; run < 240; run++) {
      const [log, row] = series[run % 3];
      const reply = await send({ mode: 'catalog', log, pauseMs: 0 }, edge.text);
      row.runs++;
      if (reply.outcome === 'ok') { row.ok++; row.ms.push(reply.ms); } else row.fail++;
    }
    for (const [, row] of series) {
      row.ms.sort((a, b) => a - b);
      row.medianMs = row.ms[Math.floor(row.ms.length / 2)] ?? null;
      row.ms = undefined;
    }
    return { contentKb: edge.contentKb, on, built, none };
  });

  await once(`${prefix}max response`, async () => {
    let low = 1;
    let high = 1024;
    const pass = async (kb) => {
      const reply = await send({ mode: 'response', responseKb: kb, pauseMs: PAUSE_MS });
      return reply.outcome === 'ok' && reply.length >= kb * 1024;
    };
    while (high <= 65536 && (await pass(high))) { low = high; high *= 2; }
    while (high - low > 32) {
      const middle = Math.floor((low + high) / 2);
      if (await pass(middle)) low = middle;
      else high = middle;
    }
    return { safe: low, fails: high };
  });

  window.probeFertig = { stage, count, ende: new Date().toISOString() };
})().catch((error) => { window.probeFehler = String(error).slice(0, 300); });
