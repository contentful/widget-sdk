import { domain } from 'Config.es6';

export default function createBackend(spaceId) {
  const BASE = `https://h7i8nmq4u3.execute-api.us-east-1.amazonaws.com/alpha/spaces/${spaceId}/functions`;
  const fnUri = fnId => `${BASE}/${fnId}`;
  const fnInvokeUri = fnId => `${fnUri(fnId)}/invoke`;

  return {
    list: () => fetch(BASE, withAuth({ method: 'GET' })).then(handle),
    create: fn => fetch(BASE, putPostOpts('POST', fn)).then(handle),
    remove: fnId => fetch(fnUri(fnId), withAuth({ method: 'DELETE' })).then(handle),
    get: fnId => fetch(fnUri(fnId), withAuth({ method: 'GET' })).then(handle),
    update: (fnId, code) => fetch(fnUri(fnId), putPostOpts('PUT', { code })).then(handle),
    invoke: (fnId, payload, noAuth) =>
      fetch(fnInvokeUri(fnId), putPostOpts('POST', payload, noAuth)).then(handleInvoke),
    getInvokeUri: fnId => `/spaces/${spaceId}/functions/${fnId}/invoke`
  };
}

function putPostOpts(method, body, noAuth) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };

  return noAuth ? withDomain(opts) : withAuth(opts);
}

function withAuth(opts) {
  opts = { ...opts };
  opts.headers = opts.headers || {};
  const token = window.localStorage.token || window.sessionStorage.token;
  opts.headers['authorization'] = `Bearer ${token}`;
  return withDomain(opts);
}

function withDomain(opts) {
  opts = { ...opts };
  opts.headers = opts.headers || {};
  opts.headers['x-contentful-domain'] = domain;
  return opts;
}

function handle(res) {
  if (res.ok) {
    return res.status === 204 ? undefined : res.json();
  }

  return res.text().then(text => {
    try {
      return Promise.reject(JSON.parse(text));
    } catch (err) {
      return Promise.reject(new Error(`Could not parse JSON:\n${text}`));
    }
  });
}

function handleInvoke(res) {
  return res.text().then(text => {
    try {
      return [res.status, text.length < 1 ? 'no content' : JSON.parse(text)];
    } catch (err) {
      return [res.status, `invalid JSON:\n${text}`];
    }
  });
}
