import createMicroBackendsClient from './MicroBackendsClient.es6';

// How often measurements should be sent.
// Please note it means some measurements may be dropped.
// We could use `localStorage` but it would require
// synchronization between opened browser tabs.
const INTERVAL = 60 * 1000;

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
    state.measurements = [...state.measurements, { name, value, ...(tags ? { tags } : {}) }];
  });
}

export function init() {
  withState(state => {
    if (!state.interval) {
      state.interval = setInterval(() => send(state), INTERVAL);
    }
  });
}

function withState(cb) {
  if (!state.client) {
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

    await state.client.call('/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
  } catch (err) {
    // Don't fail if sending failed, no matter what.
    state.measurements = [
      ...state.measurements,
      ...backupRef // Try next time...
    ];
  }
}
