import { get } from 'lodash';

import createAppsClient from './AppsClient.es6';

// This code is executed by all customers while is actually used
// only by a small fraction.
// For that reason there's more `try...catch` than one would expect.
// Better safe than sorry.

export default function createGuarded(opts) {
  opts.makeDefaultConfig = opts.makeDefaultConfig || (() => ({}));

  try {
    return create(opts);
  } catch (err) {
    return {
      get: opts.makeDefaultConfig,
      update: () => {}
    };
  }
}

function create({ spaceId, appId, makeDefaultConfig }) {
  const client = createAppsClient(spaceId);

  let config;

  return { get: getCached, update };

  async function getCached() {
    if (config) {
      return config;
    }

    try {
      const app = await client.get(appId);
      config = get(app, ['config']);
      return config;
    } catch (err) {
      return makeDefaultConfig();
    }
  }

  function update(updated) {
    config = updated;
  }
}
