import createMicroBackendsClient from './MicroBackendsClient.es6';
import { getModule } from 'NgRegistry.es6';

const { env } = getModule('environment');

// How often measurements should be sent.
const INTERVAL = 60 * 1000;

const STORAGE_KEY = 'telemetryMeasurementQueue';

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

function withState(cb) {
  if (env === 'unittest') {
    cb({ measurements: [] });
    return;
  }

  if (state.client) {
    cb(state);
    return;
  }

  // Try to read previously stored queue of outstanding measurements.
  try {
    // Always use `localStorage`.
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    localStorage.removeItem(STORAGE_KEY);
    if (Array.isArray(stored)) {
      state.measurements = stored;
    }
  } catch (err) {
    // Start with nothing if failed to read.
    state.measurements = [];
  }

  state.client = createMicroBackendsClient({ backendName: 'telemetry' });

  send(state);
  setInterval(() => send(state), INTERVAL);

  // Store outstanding measurements so they are sent in the next session.
  window.addEventListener('beforeunload', () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.measurements));
    } catch (err) {
      // Failed to stringify or store, ignore.
    }
  });

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
