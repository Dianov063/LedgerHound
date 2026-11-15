/**
 * QA (package 58): preloaded with NODE_OPTIONS=--require into every Node process of the run
 * (the Next.js dev server and its workers). Any outbound TCP connection to a host that is not
 * loopback is refused before a packet leaves the machine, and the attempt is appended to
 * QA_GUARD_LOG, so the report can prove that no external service was contacted.
 * Local IPC (named pipes / unix sockets, used by Next.js internally) is allowed.
 */
'use strict';
const net = require('node:net');
const fs = require('node:fs');

const LOG = process.env.QA_GUARD_LOG;
const LOOPBACK = (host) => {
  if (!host) return true; // default host is localhost
  const h = String(host).replace(/^\[|\]$/g, '').toLowerCase();
  return h === 'localhost' || h === '::1' || h === '0:0:0:0:0:0:0:1' || /^127\./.test(h) || h === '::ffff:127.0.0.1';
};

function record(host, port) {
  if (!LOG) return;
  try { fs.appendFileSync(LOG, JSON.stringify({ time: new Date().toISOString(), pid: process.pid, host, port }) + '\n'); } catch { /* best effort */ }
}

/* DNS: names other than localhost are not resolved (no query leaves the machine). */
const dns = require('node:dns');
const refuseDns = (host) => Object.assign(new Error(`QA loopback guard refused DNS lookup of ${host}`), { code: 'ENOTFOUND', hostname: host });
const origLookup = dns.lookup;
dns.lookup = function guardedLookup(host, ...rest) {
  if (!LOOPBACK(host) && !net.isIP(String(host))) {
    record(host, 'dns');
    const cb = rest[rest.length - 1];
    if (typeof cb === 'function') { process.nextTick(() => cb(refuseDns(host))); return {}; }
  }
  return origLookup.call(this, host, ...rest);
};
const origPromiseLookup = dns.promises.lookup;
dns.promises.lookup = function guardedPromiseLookup(host, ...rest) {
  if (!LOOPBACK(host) && !net.isIP(String(host))) { record(host, 'dns'); return Promise.reject(refuseDns(host)); }
  return origPromiseLookup.call(this, host, ...rest);
};

const original = net.Socket.prototype.connect;
net.Socket.prototype.connect = function guardedConnect(...args) {
  let opts = args[0];
  if (Array.isArray(opts)) opts = opts[0]; // internal normalized form
  let host;
  let port;
  let path;
  if (opts && typeof opts === 'object') { host = opts.host; port = opts.port; path = opts.path; }
  else if (typeof opts === 'number' || (typeof opts === 'string' && /^\d+$/.test(opts))) { port = opts; host = typeof args[1] === 'string' ? args[1] : undefined; }
  else if (typeof opts === 'string') path = opts;
  if (!path && !LOOPBACK(host)) {
    record(host, port);
    const err = Object.assign(new Error(`QA loopback guard refused a connection to ${host}:${port}`), { code: 'ECONNREFUSED' });
    process.nextTick(() => this.destroy(err));
    return this;
  }
  return original.apply(this, args);
};
