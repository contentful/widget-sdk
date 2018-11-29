'use strict';

import environment from 'environment';
import { getToken } from './Authentication.es6';

const ENV_TO_URL_PREFIX = {
  development: '/_microbackends/backends/',
  staging: 'https://staging.ctffns.net/',
  // We don't have a separate preview environment.
  // Use staging instead.
  preview: 'https://staging.ctffns.net/',
  production: 'https://backends.ctffns.net/'
};

const HAS_PROTO_RE = /^https?:\/\//;
const trimTrailingSlashes = s => (s || '').replace(/\/+$/, '');

export default function createMicroBackendsClient({ backendName, withAuth, baseUrl }) {
  const { env, gitRevision, settings } = environment;

  return { call, url };

  async function call(path, opts) {
    const token = withAuth ? await getToken() : null;

    return fetch(url(path), prepareOpts(opts, token));
  }

  function url(path) {
    path = path || '/';
    path = path.startsWith('/') ? path : `/${path}`;
    const prefix = ENV_TO_URL_PREFIX[env];
    const base = trimTrailingSlashes(baseUrl || '');

    if (gitRevision) {
      return prefix + `_rev-${gitRevision}/${backendName}` + base + path;
    } else {
      return prefix + backendName + base + path;
    }
  }

  function prepareOpts(opts, token) {
    opts = opts || {};
    opts.headers = opts.headers || {};

    if (token) {
      const api = trimTrailingSlashes(prepareApiUrl(settings.apiUrl));
      opts.headers['X-Contentful-Api'] = api;
      opts.headers['X-Contentful-Token'] = token;
    }

    return opts;
  }
}

function prepareApiUrl(apiUrl) {
  apiUrl = apiUrl || '';

  // If API URL is provided as a protocol relative URL,
  // use `window.location.protocol`.
  if (apiUrl.startsWith('//')) {
    return window.location.protocol + apiUrl;
  } else if (HAS_PROTO_RE.test(apiUrl)) {
    return apiUrl;
  } else {
    throw new Error('Could not determine CMA URL.');
  }
}
