#!/usr/bin/env node
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";

const DEFAULT_SUPABASE_URL = "https://gfvqympaaglkplzbocbl.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImdmdnF5bXBhYWdsa3BsemJvY2JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MTM2NTYsImV4cCI6MjA4NzI4OTY1Nn0.URR_2cpEO5xMsFwDGfELuYIn4g6Q8bIYKd4V-flBXhU";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

loadDotEnv();

const supabaseUrl = stripQuotes(process.env.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL;
const anonKey = stripQuotes(process.env.VITE_SUPABASE_PUBLISHABLE_KEY) || DEFAULT_SUPABASE_ANON_KEY;
const calleeToken = tokenFromArgsOrEnv("callee-token", "HYPOU_CALLEE_ACCESS_TOKEN");
const callerToken = tokenFromArgsOrEnv("caller-token", "HYPOU_CALLER_ACCESS_TOKEN");
const mode = args.mode ?? (args["conversation-id"] ? "start" : "wait");
const kind = args.kind ?? "video";
const waitSeconds = Number(args["wait-seconds"] ?? 90);
const holdSeconds = Number(args["hold-seconds"] ?? 30);
const pollMs = Number(args["poll-ms"] ?? 1000);
const headful = Boolean(args.headful);
const endOnExit = args["no-end"] !== true;
const joinCaller = Boolean(args["join-caller"]);

if (!calleeToken) {
  fail("Informe HYPOU_CALLEE_ACCESS_TOKEN ou --callee-token. Esse token precisa ser do usuário que vai atender.");
}

if (mode === "start" && !callerToken) {
  fail("Modo start exige HYPOU_CALLER_ACCESS_TOKEN ou --caller-token.");
}

if (mode === "start" && !args["conversation-id"]) {
  fail("Modo start exige --conversation-id.");
}

if (!["audio", "video"].includes(kind)) {
  fail("--kind precisa ser audio ou video.");
}

const calleeId = getJwtSub(calleeToken);
if (!calleeId) fail("Não consegui extrair o user id do token do callee.");

const log = (...parts) => console.log(`[callee-bot]`, ...parts);

let callSession = null;
let callerRoomInfo = null;
let roomInfo = null;
let browser = null;
let roomConnected = false;
let botHttpServer = null;
let botHttpUrl = null;

try {
  log(`mode=${mode}`, `callee=${calleeId}`, `kind=${kind}`);

  if (mode === "start") {
    roomInfo = await invokeFunction(callerToken, "livekit-token", {
      action: "start",
      conversation_id: args["conversation-id"],
      kind,
    });
    callerRoomInfo = roomInfo;
    callSession = await getCallSession(calleeToken, roomInfo.call_session_id);
    log("call-created", safeSession(callSession));
  } else {
    log(`waiting-ringing-call timeout=${waitSeconds}s`);
    callSession = await waitForRingingCall(calleeToken, calleeId, waitSeconds * 1000, pollMs);
    log("ringing-call-found", safeSession(callSession));
  }

  await updateCallStatus(calleeToken, callSession.id, "accepted");
  log("call-accepted", callSession.id);

  roomInfo = await invokeFunction(calleeToken, "livekit-token", {
    action: "join",
    call_session_id: callSession.id,
  });
  log("join-token-created", {
    callSessionId: roomInfo.call_session_id,
    roomName: roomInfo.room_name,
    livekitHost: hostOf(roomInfo.url),
  });

  const result = joinCaller && callerRoomInfo
    ? await connectLiveKitPairInBrowser({ caller: callerRoomInfo, callee: roomInfo }, { kind, holdSeconds, headful })
    : await connectLiveKitInBrowser(roomInfo, { kind, holdSeconds, headful });
  browser = result.browser;
  roomConnected = result.connected;

  if (!roomConnected) {
    fail("O bot entrou no navegador, mas não confirmou conexão LiveKit.");
  }

  if (!result.remoteParticipantSeen) {
    fail(
      "O bot entrou na sala, mas não viu participante remoto. Inicie a chamada no iPhone antes/depois do bot em modo wait.",
    );
  }

  log("validated", {
    callSessionId: callSession.id,
    remoteParticipants: result.remoteParticipants,
    remoteTracks: result.remoteTracks,
  });
} finally {
  if (browser && !headful) await closeBrowser(browser).catch(() => {});
  if (botHttpServer) await closeBotHttpServer().catch(() => {});
  if (callSession?.id && endOnExit) {
    await updateCallStatus(calleeToken, callSession.id, "ended").catch((error) => {
      console.warn("[callee-bot] end-call-failed", error?.message ?? String(error));
    });
  }
}

process.exit(0);

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`
LiveKit callee bot para validar chamadas do Hypou sem dois iPhones.

Uso recomendado:
  HYPOU_CALLEE_ACCESS_TOKEN="<token do usuário chamado>" \\
    npm run calls:bot -- --mode wait --kind video --hold-seconds 30

Depois inicie a chamada no iPhone com o outro usuário.

Opções:
  --mode wait|start           wait espera chamada ringing; start cria chamada antes de atender
  --kind audio|video          tipo de mídia que o bot publica no LiveKit
  --conversation-id <uuid>    obrigatório no modo start
  --join-caller               no modo start, conecta caller e callee headless para validar ponta a ponta
  --callee-token <jwt>        token Supabase do usuário que atende
  --caller-token <jwt>        token Supabase do usuário que chama, só para modo start
  --wait-seconds <n>          timeout esperando chamada no modo wait (default: 90)
  --hold-seconds <n>          tempo conectado na sala após ver remoto (default: 30)
  --headful                   abre Chromium visível para inspeção manual
  --no-end                    não marca call_sessions.status='ended' ao finalizar
`);
}

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = stripQuotes(match[2]);
  }
}

function stripQuotes(value) {
  if (!value) return "";
  return String(value).replace(/^['"]|['"]$/g, "");
}

function tokenFromArgsOrEnv(argName, envName) {
  return stripQuotes(args[argName]) || stripQuotes(process.env[envName]);
}

function getJwtSub(jwt) {
  try {
    const payload = jwt.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).sub;
  } catch {
    return null;
  }
}

async function waitForRingingCall(token, userId, timeoutMs, intervalMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const rows = await rest(token, "GET", `/call_sessions?callee_id=eq.${userId}&status=eq.ringing&select=*&order=started_at.desc&limit=1`);
    if (rows?.[0]) return rows[0];
    await sleep(intervalMs);
  }
  fail(`Nenhuma chamada ringing encontrada para callee=${userId} em ${Math.round(timeoutMs / 1000)}s.`);
}

async function getCallSession(token, callSessionId) {
  const rows = await rest(token, "GET", `/call_sessions?id=eq.${callSessionId}&select=*&limit=1`);
  if (!rows?.[0]) fail(`call_session não encontrada: ${callSessionId}`);
  return rows[0];
}

async function updateCallStatus(token, callSessionId, status) {
  return rest(token, "PATCH", `/call_sessions?id=eq.${callSessionId}`, { status });
}

async function rest(token, method, path, body) {
  const response = await fetch(`${supabaseUrl}/rest/v1${path}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: method === "PATCH" ? "return=minimal" : "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase REST ${method} ${path} failed: ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function invokeFunction(token, name, body) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error) {
    throw new Error(`Function ${name} failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function connectLiveKitInBrowser(info, options) {
  const playwright = loadPlaywright();
  const browser = await playwright.chromium.launch({
    headless: !options.headful,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  const page = await browser.newPage({
    permissions: ["camera", "microphone"],
  });
  page.on("console", (message) => log("browser", message.type(), message.text()));
  page.on("pageerror", (error) => log("browser-error", error.message));

  await prepareLiveKitPage(page);

  return page.evaluate(
    async ({ token, url, kind, holdSeconds }) => {
      const { Room, RoomEvent } = window.LivekitClient;
      const room = new Room({ adaptiveStream: false, dynacast: false });
      const state = {
        connected: false,
        remoteParticipantSeen: false,
        remoteParticipants: 0,
        remoteTracks: [],
      };

      room.on(RoomEvent.ConnectionStateChanged, (next) => console.log("[bot-call] room-state", next));
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        state.remoteParticipantSeen = true;
        state.remoteParticipants = room.remoteParticipants.size;
        console.log("[bot-call] participant-connected", participant.identity);
      });
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        state.remoteTracks.push({
          participant: participant.identity,
          source: publication.source,
          kind: track.kind,
        });
        console.log("[bot-call] track-subscribed", participant.identity, publication.source, track.kind);
      });

      await room.connect(url, token, { autoSubscribe: true });
      state.connected = true;
      state.remoteParticipantSeen = room.remoteParticipants.size > 0;
      state.remoteParticipants = room.remoteParticipants.size;
      console.log("[bot-call] connected", JSON.stringify({ remoteParticipants: state.remoteParticipants }));

      await room.localParticipant.setMicrophoneEnabled(true);
      console.log("[bot-call] microphone-published");
      if (kind === "video") {
        await room.localParticipant.setCameraEnabled(true);
        console.log("[bot-call] camera-published");
      }

      const deadline = Date.now() + holdSeconds * 1000;
      while (!state.remoteParticipantSeen && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        state.remoteParticipantSeen = room.remoteParticipants.size > 0;
        state.remoteParticipants = room.remoteParticipants.size;
      }

      const postRemoteDeadline = Date.now() + 3000;
      while (state.remoteParticipantSeen && Date.now() < postRemoteDeadline) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        state.remoteParticipants = room.remoteParticipants.size;
      }

      await room.disconnect();
      return state;
    },
    {
      token: info.token,
      url: info.url,
      kind: options.kind,
      holdSeconds: options.holdSeconds,
    },
  ).then((state) => ({ ...state, browser }));
}

async function connectLiveKitPairInBrowser(info, options) {
  const playwright = loadPlaywright();
  const browser = await playwright.chromium.launch({
    headless: !options.headful,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  const callerPage = await browser.newPage({ permissions: ["camera", "microphone"] });
  const calleePage = await browser.newPage({ permissions: ["camera", "microphone"] });
  callerPage.on("console", (message) => log("caller-browser", message.type(), message.text()));
  calleePage.on("console", (message) => log("callee-browser", message.type(), message.text()));
  callerPage.on("pageerror", (error) => log("caller-browser-error", error.message));
  calleePage.on("pageerror", (error) => log("callee-browser-error", error.message));

  await Promise.all([
    prepareLiveKitPage(callerPage),
    prepareLiveKitPage(calleePage),
  ]);

  const callerPromise = connectPageToLiveKit(callerPage, info.caller, {
    role: "caller",
    kind: options.kind,
    holdSeconds: options.holdSeconds,
  });
  await sleep(1000);
  const calleePromise = connectPageToLiveKit(calleePage, info.callee, {
    role: "callee",
    kind: options.kind,
    holdSeconds: options.holdSeconds,
  });

  const [callerState, calleeState] = await Promise.all([callerPromise, calleePromise]);
  const remoteTracks = [
    ...callerState.remoteTracks.map((track) => ({ observer: "caller", ...track })),
    ...calleeState.remoteTracks.map((track) => ({ observer: "callee", ...track })),
  ];

  return {
    browser,
    connected: callerState.connected && calleeState.connected,
    remoteParticipantSeen:
      (callerState.remoteParticipantSeen || callerState.remoteTracks.length > 0)
      && (calleeState.remoteParticipantSeen || calleeState.remoteTracks.length > 0),
    remoteParticipants: callerState.remoteParticipants + calleeState.remoteParticipants,
    remoteTracks,
  };
}

async function prepareLiveKitPage(page) {
  const url = await getBotHttpUrl();
  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });
  await page.addScriptTag({ path: resolve("node_modules/livekit-client/dist/livekit-client.umd.js") });
}

function getBotHttpUrl() {
  if (botHttpUrl) return botHttpUrl;
  botHttpServer = createServer((_, response) => {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end("<!doctype html><html><body><h1>Hypou LiveKit call bot</h1></body></html>");
  });
  return new Promise((resolveUrl, reject) => {
    botHttpServer.once("error", reject);
    botHttpServer.listen(0, "127.0.0.1", () => {
      const address = botHttpServer.address();
      botHttpUrl = `http://127.0.0.1:${address.port}/`;
      resolveUrl(botHttpUrl);
    });
  });
}

function closeBotHttpServer() {
  return new Promise((resolveClose, reject) => {
    botHttpServer.closeIdleConnections?.();
    botHttpServer.closeAllConnections?.();
    const timeout = setTimeout(resolveClose, 2000);
    botHttpServer.close((error) => {
      clearTimeout(timeout);
      return error ? reject(error) : resolveClose();
    });
  });
}

async function closeBrowser(openBrowser) {
  const close = openBrowser.close().catch(() => {});
  await Promise.race([close, sleep(3000)]);
  openBrowser.process?.()?.kill?.("SIGKILL");
}

async function connectPageToLiveKit(page, info, options) {
  return page.evaluate(
    async ({ token, url, kind, holdSeconds, role }) => {
      const { Room, RoomEvent } = window.LivekitClient;
      const room = new Room({ adaptiveStream: false, dynacast: false });
      const state = {
        connected: false,
        remoteParticipantSeen: false,
        remoteParticipants: 0,
        remoteTracks: [],
      };

      room.on(RoomEvent.ConnectionStateChanged, (next) => console.log(`[${role}] room-state`, next));
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        state.remoteParticipantSeen = true;
        state.remoteParticipants = room.remoteParticipants.size;
        console.log(`[${role}] participant-connected`, participant.identity);
      });
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        state.remoteTracks.push({
          participant: participant.identity,
          source: publication.source,
          kind: track.kind,
        });
        console.log(`[${role}] track-subscribed`, participant.identity, publication.source, track.kind);
      });

      await room.connect(url, token, { autoSubscribe: true });
      state.connected = true;
      await room.localParticipant.setMicrophoneEnabled(true);
      console.log(`[${role}] microphone-published`);
      if (kind === "video") {
        await room.localParticipant.setCameraEnabled(true);
        console.log(`[${role}] camera-published`);
      }

      const deadline = Date.now() + holdSeconds * 1000;
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        state.remoteParticipantSeen = room.remoteParticipants.size > 0;
        state.remoteParticipants = room.remoteParticipants.size;
      }

      await room.disconnect();
      return state;
    },
    {
      token: info.token,
      url: info.url,
      kind: options.kind,
      holdSeconds: options.holdSeconds,
      role: options.role,
    },
  );
}

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  try {
    return require("playwright");
  } catch {
    const bundled = "/Users/will/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright";
    if (existsSync(bundled)) return require(bundled);
    fail("Playwright não está instalado. Rode com o runtime do Codex ou instale playwright.");
  }
}

function safeSession(row) {
  return {
    id: row.id,
    status: row.status,
    kind: row.kind,
    caller_id: row.caller_id,
    callee_id: row.callee_id,
    conversation_id: row.conversation_id,
    room_name: row.room_name,
  };
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fail(message) {
  throw new Error(message);
}
