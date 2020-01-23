import createMicroBackendsClient from 'MicroBackendsClient';
import { gitRevision as uiVersion } from 'Config';

// How often measurements should be sent.
// Please note it means some measurements may be dropped.
// We could use `localStorage` but it would require
// synchronization between opened browser tabs.
const INTERVAL = 120 * 1000;

// We want to send the first batch of measurements
// sooner than `INTERVAL`. We do it after `INITIAL_DELAY`
// and only then setup the long-running interval.
const INITIAL_DELAY = 10 * 1000;

const makeMeasurement = (name, value, tags, { initializedAt }) => {
  if (tags) {
    tags.uiVersion = uiVersion;
  } else {
    tags = { uiVersion };
  }

  // The "post initialization window" is the 15 window in which the request occurred,
  // starting from 1.
  //
  // That means, if the request occurred at 1:30, its `postInitializationWindow` would be 1,
  // and if at 17:45, its window would be 2.
  //
  // Doing `|| 1` at the end guarantees that this will always be at minimum 1 (never 0).
  const postInitializationWindow = Math.ceil((Date.now() - initializedAt) / (15 * 60 * 1000)) || 1;

  tags.postInitializationWindow = postInitializationWindow;

  return { name, value, tags };
};

const state = {};

// Records a measurement of value `1`.
// `name` is a string metric name and `tags` is an optional
// object of tags `{ 'tag-name': 'tag-value' }`.
// Useful for couting events as described here:
// https://www.librato.com/docs/kb/faq/app_questions/count_events/
export function count(name, tags) {
  record(name, 1, tags);
}

// Records any arbitrary measurment of value `value`.
// `name` is a string metric name and `tags` is an optional
// object of tags `{ 'tag-name': 'tag-value' }`.
export function record(name, value, tags) {
  withState(state => {
    state.measurements = [...state.measurements, makeMeasurement(name, value, tags, state)];
  });
}

// `countImmediate` and `recordImmediate` are immediate
// counterparts of `count` and `record`. They don't wait
// for the `INTERVAL` to pass and instead call Librato
// right away.
// These functions can be used for debugging, from E2E
// or Puppeteer scripts.
// Please note they'll write to console in case of failure.
// In the Web App code use only `count` and `record`.
export function countImmediate(name, tags) {
  recordImmediate(name, 1, tags);
}

export function recordImmediate(name, value, tags) {
  withState(state => {
    const body = JSON.stringify([makeMeasurement(name, value, tags, state)]);
    callBackend(state.client, body).catch(err => {
      // eslint-disable-next-line no-console
      console.error('Could not send measurement.', body, err);
    });
  });
}

export function init() {
  withState(state => {
    if (!state.initialized) {
      state.initialized = true;

      setTimeout(() => {
        send(state);
        setInterval(() => send(state), INTERVAL);
      }, INITIAL_DELAY);
    }
  });
}

function withState(cb) {
  if (!state.client) {
    // Although the name of this isn't exactly correct, the first recording and the initialization
    // occur at essentially the same time and since we are using a window, the exact time that
    // the telemetry was initialized isn't critically important. Doing this here also guarantees that
    // `initializedAt` is always available in `state`.
    state.initializedAt = Date.now();
    state.measurements = [];
    state.client = createMicroBackendsClient({ backendName: 'telemetry' });
  }

  cb(state);
}

async function send(state) {
  if (state.measurements.length < 1) {
    return;
  }

  const backupRef = state.measurements;

  try {
    const body = JSON.stringify(state.measurements);
    state.measurements = [];
    await callBackend(state.client, body);
  } catch (err) {
    // Don't fail if sending failed, no matter what.
    state.measurements = [
      ...state.measurements,
      ...backupRef // Try next time...
    ];
  }
}

function callBackend(client, body) {
  return client.call('/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
}
