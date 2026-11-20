const PROBE_RETAINED = [];
const PROBE_STOP = { probeStop: true };
const PROBE_RECORDS_PER_BLOCK = 100;

function param(name, fallback) {
    const value = Server.Context.QueryParameters[name];
    return value === undefined || value === null || value === "" ? fallback : String(value);
}

function numberParam(name, fallback) {
    const value = Number(param(name, fallback));
    return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function flatString(chars, kind) {
    const text = (kind === "twoByte" ? "•" : "0").repeat(chars);
    text.charCodeAt(chars >> 1);
    return text;
}

function recordBlockText(block) {
    const records = [];
    for (let index = 0; index < PROBE_RECORDS_PER_BLOCK; index++) {
        const suffix = String(block * PROBE_RECORDS_PER_BLOCK + index).padStart(12, "0");
        records.push({
            id: "aaaaaaaa-0000-4000-8000-" + suffix,
            parentid: "bbbbbbbb-0000-4000-8000-" + suffix,
            name: "Attribute " + suffix,
            amount: index % 3 ? index * 1.5 : null,
            valueid: "cccccccc-0000-4000-8000-" + suffix,
            value: { id: "dddddddd-0000-4000-8000-" + suffix, code: "C-" + suffix, name: "Value " + suffix },
        });
    }
    return JSON.stringify(records);
}

function allocateBallast() {
    const ballastKb = numberParam("ballastKb", 0);
    const kind = param("ballastKind", "latin1");
    if (kind === "objects") {
        let allocated = 0;
        let block = 0;
        while (allocated < ballastKb * 1024) {
            const text = recordBlockText(block);
            allocated += text.length;
            PROBE_RETAINED.push(JSON.parse(text));
            block++;
        }
        return;
    }
    const chunk = Math.max(numberParam("chunkKb", 256), 1) * 1024;
    let remaining = ballastKb * 1024;
    while (remaining > 0) {
        const chars = Math.min(remaining, chunk);
        PROBE_RETAINED.push(flatString(chars, kind));
        remaining -= chars;
    }
}

function pause() {
    const until = Date.now() + numberParam("pauseMs", 0);
    while (Date.now() < until) {
        Math.sqrt(until);
    }
}

function checkpoint(name) {
    if (param("stopAt", "") !== name) {
        return;
    }
    if (param("ballastAt", "start") === "stop") {
        allocateBallast();
    }
    pause();
    throw PROBE_STOP;
}

function writeLog(content) {
    const mode = param("log", "none");
    if (mode === "none") {
        return;
    }
    const text = "content " + JSON.stringify(content);
    if (mode === "on") {
        Server.Logger.Log(text);
    }
}

function loadOnce() {
    const contextBody = Server.Context.Body;
    const raw = typeof contextBody === "string" ? contextBody : JSON.stringify(contextBody);
    checkpoint("1-raw");
    const outer = JSON.parse(raw);
    checkpoint("2-wrapper");
    const api = JSON.parse(outer.Body);
    checkpoint("3-body");
    const content = JSON.parse(api.Content);
    checkpoint("4-content");
    return { api, content };
}

function runCatalog() {
    const calls = Math.max(numberParam("calls", 1), 1);
    let last = null;
    for (let call = 0; call < calls; call++) {
        last = loadOnce();
        if (call < calls - 1) {
            last = null;
            checkpoint("5-discarded");
        }
    }
    checkpoint("6-loaded");
    writeLog(last.content);
    checkpoint("7-logged");
    return last.api;
}

function post() {
    const mode = param("mode", "ballast");
    PROBE_RETAINED.length = 0;
    if (param("ballastAt", "start") === "start") {
        allocateBallast();
    }
    let result = { completed: true };
    let stopped = false;
    if (mode === "catalog") {
        try {
            const api = runCatalog();
            result = param("respond", "on") === "on" ? { data: api } : { completed: true };
        } catch (error) {
            if (error !== PROBE_STOP) {
                throw error;
            }
            stopped = true;
            result = { stopped: true };
        }
    } else if (mode === "response") {
        const text = '{"p":"' + flatString(numberParam("responseKb", 1) * 1024, "latin1") + '"}';
        pause();
        return text;
    } else if (mode === "setting") {
        result = { memorySetting: String(Server.SiteSetting.Get("ServerLogic/MaxMemoryUsageInBytes")) };
    }
    if (!stopped) {
        pause();
    }
    return JSON.stringify(result);
}
