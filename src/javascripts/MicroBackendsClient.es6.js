import { getToken } from './Authentication.es6';
import { apiUrl, microBackendsUrl, gitRevision } from 'Config.es6';

const HAS_PROTO_RE = /^https?:\/\//;
const trimTrailingSlashes = s => (s || '').replace(/\/+$/, '');

export default function createMicroBackendsClient({ backendName, withAuth, baseUrl }) {
  const base = trimTrailingSlashes(baseUrl || '');

  return { call, url };

  async function call(path, opts) {
    const token = withAuth ? await getToken() : null;

    return window.fetch(url(path), prepareOpts(opts, token));
  }

  function url(path) {
    path = path || '/';
    path = path.startsWith('/') ? path : `/${path}`;

    if (gitRevision) {
      return microBackendsUrl(`_rev-${gitRevision}/${backendName}` + base + path);
    } else {
      return microBackendsUrl(backendName + base + path);
    }
  }

  function prepareOpts(opts, token) {
    opts = opts || {};
    opts.headers = opts.headers || {};

    if (token) {
      Object.assign(opts.headers, {
        'X-Contentful-Api': trimTrailingSlashes(prepareApiUrl()),
        'X-Contentful-Token': token
      });
    }

    return opts;
  }
}

function prepareApiUrl() {
  const url = apiUrl('/');

  // If API URL is provided as a protocol relative URL,
  // use `window.location.protocol`.
  if (url.startsWith('//')) {
    return window.location.protocol + url;
  } else if (HAS_PROTO_RE.test(url)) {
    return url;
  } else {
    throw new Error('Could not determine CMA URL.');
  }
}
