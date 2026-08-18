#!/usr/bin/env node

const assert = require('assert');
const vm = require('vm');
const {
  ADSENSE_CLIENT,
  ADSENSE_HORIZONTAL_SLOT,
  generateAdNetworkHeadScript,
} = require('../src/utils/adProviders');

class FakeElement {
  constructor() {
    this.attributes = new Map([
      ['class', 'adsbygoogle'],
      ['data-ad-client', ADSENSE_CLIENT],
      ['data-ad-slot', ADSENSE_HORIZONTAL_SLOT],
      ['data-ad-placement', 'test_placement'],
    ]);
    this.hasCreative = false;
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  matches(selector) {
    return selector.startsWith('ins.adsbygoogle');
  }

  querySelector(selector) {
    if (this.hasCreative && selector.includes('iframe')) return {};
    return null;
  }

  querySelectorAll() {
    return [];
  }
}

function extractRuntime() {
  const markup = generateAdNetworkHeadScript(true);
  const scripts = [...markup.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  const inline = scripts.find((match) => match[1].includes('__requestAdSenseSlot'));
  assert(inline, 'Could not extract generated AdSense runtime');
  return { markup, code: inline[1] };
}

function createRuntime({ gated = false } = {}) {
  const ad = new FakeElement();
  const timers = [];
  const mutationObservers = [];
  const verifiedCallbacks = [];
  const loadedScripts = [];

  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.disconnected = false;
      mutationObservers.push(this);
    }

    observe() {}
    disconnect() { this.disconnected = true; }
  }

  const document = {
    readyState: 'complete',
    matches: undefined,
    head: {
      appendChild(script) { loadedScripts.push(script); },
    },
    querySelector(selector) {
      if (selector === 'script[data-adsense-loader]') return loadedScripts[0] || null;
      return null;
    },
    querySelectorAll() { return [ad]; },
    addEventListener() {},
    createElement(tagName) {
      assert.strictEqual(tagName, 'script');
      return {
        attributes: new Map(),
        setAttribute(name, value) { this.attributes.set(name, String(value)); },
        addEventListener() {},
      };
    },
  };
  const window = {
    document,
    adsbygoogle: [],
    setTimeout(callback, delay) {
      timers.push({ callback, delay });
      return timers.length;
    },
    matchMedia() {
      return {
        matches: true,
        addEventListener() {},
        removeEventListener() {},
      };
    },
  };
  if (gated) {
    window.botDetector = {
      shouldBlockAds() { return true; },
      onVerified(callback) { verifiedCallbacks.push(callback); },
    };
  }

  const context = {
    window,
    document,
    MutationObserver: FakeMutationObserver,
    WeakSet,
  };
  vm.runInNewContext(extractRuntime().code, context);

  return {
    ad,
    window,
    timers,
    mutationObservers,
    loadedScripts,
    verify() {
      assert(verifiedCallbacks.length >= 2, 'AdSense library and ad request did not wait for verification');
      window.botDetector.shouldBlockAds = () => false;
      verifiedCallbacks.splice(0).forEach((callback) => callback());
    },
  };
}

function testVerificationAndDeduplication() {
  const runtime = createRuntime({ gated: true });
  assert.strictEqual(runtime.window.__activeAdProvider, 'adsense');
  assert.strictEqual(runtime.window.adsbygoogle.length, 0, 'AdSense requested an ad before verification');
  assert.strictEqual(runtime.loadedScripts.length, 0, 'AdSense library loaded before verification');
  assert.strictEqual(runtime.ad.getAttribute('data-ad-pending'), 'true');

  runtime.verify();
  assert.strictEqual(runtime.loadedScripts.length, 1, 'AdSense library was not loaded after verification');
  assert.strictEqual(runtime.loadedScripts[0].attributes.get('data-overlays'), 'bottom');
  assert.strictEqual(runtime.window.adsbygoogle.length, 1, 'Verified AdSense slot was not requested');
  assert.strictEqual(runtime.ad.getAttribute('data-ad-requested'), 'true');
  assert.strictEqual(runtime.ad.getAttribute('data-ad-fill-state'), 'pending');

  runtime.window.__initAdSenseSlots(runtime.ad);
  runtime.window.__requestAdSenseSlot(runtime.ad);
  assert.strictEqual(runtime.window.adsbygoogle.length, 1, 'AdSense slot was requested more than once');

  runtime.ad.setAttribute('data-ad-status', 'filled');
  runtime.mutationObservers[0].callback();
  assert.strictEqual(runtime.ad.getAttribute('data-ad-fill-state'), 'filled');
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(runtime.window.__getAdFillStatus())),
    { activeProvider: 'adsense', adsense: [{ slot: ADSENSE_HORIZONTAL_SLOT, placement: 'test_placement', state: 'filled' }] },
  );
}

function testEmptyFillTimeout() {
  const runtime = createRuntime();
  assert.strictEqual(runtime.loadedScripts.length, 1);
  assert.strictEqual(runtime.window.adsbygoogle.length, 1);
  const fillTimer = runtime.timers.find((timer) => timer.delay === 18000);
  assert(fillTimer, 'AdSense fill timeout was not scheduled');
  fillTimer.callback();
  assert.strictEqual(runtime.ad.getAttribute('data-ad-fill-state'), 'empty');
  assert.strictEqual(runtime.window.__getAdFillStatus().adsense[0].state, 'empty');
}

function testGeneratedRuntimeIsAdSenseOnly() {
  const { markup } = extractRuntime();
  assert(markup.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'));
  assert(markup.includes(ADSENSE_CLIENT));
  assert(markup.includes("window.__adsReady(window.__loadAdSenseScript)"));
  assert(markup.includes("script.setAttribute('data-overlays', 'bottom')"));
  assert(!markup.includes('<script async src="https://pagead2.googlesyndication.com'));
  assert(!/monu\.delivery|monumetric|\$MMT|mmt-/i.test(markup));
}

testVerificationAndDeduplication();
testEmptyFillTimeout();
testGeneratedRuntimeIsAdSenseOnly();

console.log('AdSense runtime tests passed (verified library load, native anchor, deduplication, fill, and no-fill).');
