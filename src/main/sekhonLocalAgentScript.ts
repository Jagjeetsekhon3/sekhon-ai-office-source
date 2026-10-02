/**
 * Source for the built-in Sekhon Local terminal agent.
 *
 * Main writes this CommonJS program into the app's userData directory and runs it
 * with Electron's bundled Node runtime (ELECTRON_RUN_AS_NODE=1). Keeping the
 * runtime as plain JS means the provider needs no external CLI or npm install.
 */
export const SEKHON_LOCAL_AGENT_SCRIPT = String.raw`'use strict';

const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const readline = require('node:readline');
const cp = require('node:child_process');
const crypto = require('node:crypto');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const MODEL = arg('--model') || process.env.SEKHON_LOCAL_MODEL || '';
const BASE_RAW = process.env.SEKHON_LOCAL_BASE_URL || 'http://localhost:11434/v1';
const BASE = BASE_RAW.endsWith('/') ? BASE_RAW.slice(0, -1) : BASE_RAW;
const SYSTEM = arg('--system') || 'You are a helpful local AI agent inside Sekhon AI Office.';
const AUTO = process.env.SEKHON_LOCAL_AUTO === '1';
const AGENT = process.env.AGENT_ID || 'local-agent';
const SESSION = crypto.randomUUID();
const CWD = path.resolve(process.cwd());
const allowedRoots = [CWD, process.env.AGENT_DIR, process.env.HIVE_ROOT]
  .filter(Boolean).map((p) => path.resolve(p));

function insideAllowed(p) {
  const target = path.resolve(CWD, String(p || '.'));
  const ok = allowedRoots.some((root) => target === root || target.startsWith(root + path.sep));
  if (!ok) throw new Error('Path is outside this agent workspace/hive');
  return target;
}
function clip(v, n) {
  const s = String(v == null ? '' : v);
  return s.length > n ? s.slice(0, n) + '\n...[truncated]' : s;
}
function hook(payload, waitForReply) {
  return new Promise((resolve) => {
    const sock = process.env.HIVE_SOCK;
    if (!sock) return resolve({});
    let out = '';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { resolve(JSON.parse(out || '{}')); } catch (_) { resolve({}); }
    };
    try {
      payload.agent_id = AGENT;
      payload.session_id = SESSION;
      payload.cwd = CWD;
      const c = net.createConnection(sock, () => {
        c.write(JSON.stringify(payload) + '\n');
        if (!waitForReply) c.end();
      });
      c.setEncoding('utf8');
      c.on('data', (d) => { out += d; });
      c.on('end', finish);
      c.on('close', finish);
      c.on('error', finish);
      setTimeout(() => { try { c.destroy(); } catch (_) {} finish(); }, waitForReply ? 5000 : 1200).unref();
    } catch (_) { finish(); }
  });
}

const readOnlyTools = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a UTF-8 text file inside the project or Sekhon hive.',
      parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files and folders in a directory inside the project or Sekhon hive.',
      parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }
    }
  }
];
const writeTools = [
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write UTF-8 text to a file inside the project or Sekhon hive. Available only when Auto mode is enabled.',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string' }, content: { type: 'string' } },
        required: ['path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Run a shell command in the agent project. Available only when Auto mode is enabled.',
      parameters: {
        type: 'object',
        properties: { command: { type: 'string' } },
        required: ['command']
      }
    }
  }
];
const TOOLS = AUTO ? readOnlyTools.concat(writeTools) : readOnlyTools;

async function executeTool(name, input) {
  const gate = await hook({ hook_event_name: 'PreToolUse', tool_name: name, tool_input: input }, true);
  const denied = gate && gate.hookSpecificOutput && gate.hookSpecificOutput.permissionDecision === 'deny';
  if (denied) return 'Tool denied by Sekhon AI Office: ' + (gate.hookSpecificOutput.permissionDecisionReason || 'permission denied');
  try {
    let result;
    if (name === 'read_file') {
      result = fs.readFileSync(insideAllowed(input.path), 'utf8');
    } else if (name === 'list_files') {
      const dir = insideAllowed(input.path);
      result = fs.readdirSync(dir, { withFileTypes: true }).slice(0, 250)
        .map((e) => (e.isDirectory() ? '[dir] ' : '[file] ') + e.name).join('\n');
    } else if (name === 'write_file') {
      if (!AUTO) throw new Error('Auto mode is required for file writes');
      const dest = insideAllowed(input.path);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, String(input.content || ''), 'utf8');
      result = 'Wrote ' + dest;
    } else if (name === 'run_command') {
      if (!AUTO) throw new Error('Auto mode is required for shell commands');
      result = cp.execSync(String(input.command || ''), {
        cwd: CWD,
        encoding: 'utf8',
        timeout: 120000,
        maxBuffer: 2 * 1024 * 1024,
        env: process.env
      });
    } else {
      throw new Error('Unknown tool: ' + name);
    }
    await hook({ hook_event_name: 'PostToolUse', tool_name: name, tool_input: input }, false);
    return clip(result, 20000);
  } catch (e) {
    await hook({ hook_event_name: 'PostToolUse', tool_name: name, tool_input: input }, false);
    return 'Tool error: ' + (e && e.message ? e.message : String(e));
  }
}

const messages = [{ role: 'system', content: SYSTEM }];
let toolsSupported = true;

async function completion() {
  const body = { model: MODEL, messages: messages, temperature: 0.2 };
  if (toolsSupported && TOOLS.length) body.tools = TOOLS;
  let res = await fetch(BASE + '/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10 * 60 * 1000)
  });
  // Some otherwise OpenAI-compatible local servers/models do not implement tool
  // calling. Fall back to chat-only instead of making the whole provider unusable.
  if (!res.ok && toolsSupported && TOOLS.length && (res.status === 400 || res.status === 404 || res.status === 422)) {
    toolsSupported = false;
    delete body.tools;
    res = await fetch(BASE + '/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10 * 60 * 1000)
    });
  }
  if (!res.ok) throw new Error('Local model server returned HTTP ' + res.status + ': ' + clip(await res.text(), 1200));
  const data = await res.json();
  const msg = data && data.choices && data.choices[0] && data.choices[0].message;
  if (!msg) throw new Error('Local model server returned no assistant message');
  return msg;
}

async function runTurn(text) {
  await hook({ hook_event_name: 'UserPromptSubmit', prompt: text }, false);
  messages.push({ role: 'user', content: text });
  for (let round = 0; round < 10; round++) {
    const msg = await completion();
    messages.push(msg);
    const calls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
    if (!calls.length) {
      const answer = msg.content == null ? '' : String(msg.content);
      process.stdout.write('\r\n' + answer + '\r\n');
      const stop = await hook({ hook_event_name: 'Stop' }, true);
      if (stop && stop.decision === 'block' && stop.reason) {
        messages.push({ role: 'user', content: String(stop.reason) });
        continue;
      }
      return;
    }
    for (const call of calls) {
      const fn = call && call.function ? call.function : {};
      let input = {};
      try { input = JSON.parse(fn.arguments || '{}'); } catch (_) {}
      process.stdout.write('\r\n[tool] ' + String(fn.name || 'unknown') + '\r\n');
      const output = await executeTool(String(fn.name || ''), input);
      messages.push({ role: 'tool', tool_call_id: call.id, content: output });
    }
  }
  process.stdout.write('\r\n[warning] Tool loop limit reached.\r\n');
  await hook({ hook_event_name: 'Stop' }, false);
}

async function compactConversation(focus) {
  if (messages.length <= 3) return 'Context is already small.';
  const transcript = messages.slice(1).map((m) => {
    const role = m.role || 'unknown';
    const content = typeof m.content === 'string' ? m.content : '';
    return role + ': ' + content;
  }).join('\n');
  const request = {
    model: MODEL,
    messages: [
      { role: 'system', content: 'Summarize this conversation into compact working memory. Preserve decisions, constraints, file changes, unresolved tasks and exact identifiers. ' + (focus || '') },
      { role: 'user', content: clip(transcript, 80000) }
    ],
    temperature: 0.1
  };
  const res = await fetch(BASE + '/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(10 * 60 * 1000)
  });
  if (!res.ok) throw new Error('Compaction failed with HTTP ' + res.status);
  const data = await res.json();
  const summary = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!summary) throw new Error('Compaction returned no summary');
  messages.splice(1, messages.length - 1, { role: 'system', content: 'Conversation memory:\n' + String(summary) });
  return 'Context compacted.';
}

async function main() {
  if (!MODEL) {
    process.stderr.write('Sekhon Local: no model selected. Open Settings > Agents & Models, connect a local server, then choose Use.\r\n');
    process.exit(2);
  }
  process.stdout.write('Sekhon Local Agent\r\n');
  process.stdout.write('Model: ' + MODEL + '\r\nServer: ' + BASE + '\r\n');
  process.stdout.write('Tools: ' + (AUTO ? 'read/write/shell (Auto mode)' : 'read-only') + '\r\n\r\n');
  await hook({ hook_event_name: 'SessionStart' }, false);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true, prompt: '> ' });
  let busy = false;
  rl.prompt();
  rl.on('line', async (line) => {
    const text = line.trim();
    if (!text) { rl.prompt(); return; }
    if (text === '/clear') {
      messages.splice(1);
      process.stdout.write('Context cleared.\r\n');
      rl.prompt();
      return;
    }
    if (text === '/compact' || text.startsWith('/compact ')) {
      busy = true;
      try { process.stdout.write((await compactConversation(text.slice('/compact'.length).trim())) + '\r\n'); }
      catch (e) { process.stderr.write('[compact error] ' + (e && e.message ? e.message : String(e)) + '\r\n'); }
      busy = false;
      rl.prompt();
      return;
    }
    if (busy) { process.stdout.write('Agent is still working.\r\n'); rl.prompt(); return; }
    busy = true;
    try { await runTurn(text); }
    catch (e) { process.stderr.write('\r\n[local agent error] ' + (e && e.message ? e.message : String(e)) + '\r\n'); }
    busy = false;
    rl.prompt();
  });
}
main().catch((e) => {
  process.stderr.write('Sekhon Local failed: ' + (e && e.message ? e.message : String(e)) + '\r\n');
  process.exit(1);
});
`;
