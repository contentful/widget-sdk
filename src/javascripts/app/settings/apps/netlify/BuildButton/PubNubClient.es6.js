import { getModule } from 'NgRegistry.es6';
import { isObject, identity } from 'lodash';

const LazyLoader = getModule('LazyLoader');

// These are front-end safe credentials that can be used in all environments.
// PubNub account is "team-extensibility@contentful.com", see LastPass.
const PUBLISH_KEY = 'pub-c-a99421b9-4f21-467b-ac0c-d0292824e8e1';
const SUBSCRIBE_KEY = 'sub-c-3992b1ae-f7c9-11e8-adf7-5a5b31762c0f';

export function getPostPublishUrl(channel) {
  return `https://ps.pndsn.com/publish/${PUBLISH_KEY}/${SUBSCRIBE_KEY}/0/${channel}/0?store=1`;
}

function timetokenToDate(timetoken) {
  // timetokens arrive as strings
  timetoken = parseInt(timetoken, 10);
  // timetoken is 17-digit precision unix time,
  // hence 10e6 division for regular unix time
  const unix = Math.round(timetoken / 10e6);
  // JavaScript uses milliseconds, hence *1000
  return new Date(unix * 1000);
}

function normalize(message, timetoken, normalizeFn = identity) {
  if (!isObject(message) || typeof timetoken !== 'string') {
    return null;
  }

  const normalized = normalizeFn(message);
  if (isObject(normalized)) {
    return { ...normalized, t: timetokenToDate(timetoken) };
  } else {
    return null;
  }
}

export function createPubSub(channel, normalizeFn) {
  const channels = [channel];
  const state = { listeners: [] };

  return {
    start,
    addListener: fn => state.listeners.push(fn),
    publish,
    getHistory,
    stop
  };

  async function start() {
    const PubNub = await LazyLoader.get('PubNub');

    state.instance = new PubNub({
      publishKey: PUBLISH_KEY,
      subscribeKey: SUBSCRIBE_KEY
    });

    state.mainListener = {
      message: ({ message, timetoken }) => {
        const normalized = normalize(message, timetoken, normalizeFn);
        if (isObject(normalized)) {
          state.listeners.forEach(fn => fn(normalized));
        }
      }
    };

    state.instance.addListener(state.mainListener);
    state.instance.subscribe({ channels });
  }

  function publish(message) {
    return new Promise((resolve, reject) => {
      state.instance.publish(
        {
          message,
          channel,
          storeInHistory: true
        },
        (status, res) => {
          if (status.error) {
            reject(status);
          } else {
            resolve(res);
          }
        }
      );
    });
  }

  function getHistory(count = 25) {
    return new Promise((resolve, reject) => {
      state.instance.history(
        {
          channel,
          count,
          stringifiedTimeToken: true
        },
        (status, res) => {
          if (status.error) {
            reject(status);
          } else {
            const history = (res.messages || [])
              .map(({ timetoken, entry }) => normalize(entry, timetoken, normalizeFn))
              .filter(isObject)
              .reverse();

            resolve(history);
          }
        }
      );
    });
  }

  function stop() {
    if (state.instance) {
      state.instance.removeListener(state.mainListener);
      state.listeners = [];
      state.instance.unsubscribe({ channels });
    }
  }
}
