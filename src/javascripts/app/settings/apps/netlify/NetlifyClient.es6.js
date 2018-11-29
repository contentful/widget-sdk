const CLIENT_ID = '83307e7b9c33406c2fb0fc69a61705189d130da28e7d99d42f01f22996341764';
const API_BASE = 'https://api.netlify.com/api/v1';
const AUTHORIZE_ENDPOINT = 'https://app.netlify.com/authorize';
const WINDOW_OPTS = 'left=150,top=150,width=700,height=700';
const AUTH_POLL_INTERVAL = 1000;

async function request(method, url, accessToken, body) {
  const headers = method === 'POST' ? { 'Content-Type': 'application/json' } : {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  body = typeof body === 'object' ? JSON.stringify(body) : '';
  body = method === 'GET' ? undefined : body;

  const res = await fetch(API_BASE + url, { method, headers, body });

  return res.ok ? res.json() : Promise.reject(new Error('Non-2xx response.'));
}

const post = request.bind(null, 'POST');
const get = request.bind(null, 'GET');

function openAuthorizationWindow(ticketId) {
  const url = `${AUTHORIZE_ENDPOINT}?response_type=ticket&ticket=${ticketId}`;
  return window.open(url, '', WINDOW_OPTS);
}

function rescheduleTicketAuthorizationCheck(ticketId, deferred) {
  setTimeout(() => {
    checkTicketAuthorization(ticketId, deferred);
  }, AUTH_POLL_INTERVAL);
}

async function checkTicketAuthorization(ticketId, deferred) {
  try {
    const body = await get(`/oauth/tickets/${ticketId}`);

    if (body.authorized) {
      deferred.cb(null, body.id);
    } else if (!deferred.cancelled) {
      rescheduleTicketAuthorizationCheck(ticketId, deferred);
    }
  } catch (err) {
    deferred.cb(err);
  }
}

function waitForTicketAuthorization(ticketId, cb) {
  const deferred = { cb, cancelled: false };
  checkTicketAuthorization(ticketId, deferred);

  return () => {
    deferred.cancelled = true;
  };
}

async function exchangeTicketForToken(ticketId) {
  const { access_token } = await post(`/oauth/tickets/${ticketId}/exchange`);
  return access_token;
}

export async function createTicket() {
  const { id } = await post(`/oauth/tickets?client_id=${CLIENT_ID}`);
  return id;
}

export function getAccessTokenWithTicket(ticketId, cb) {
  const authWindow = openAuthorizationWindow(ticketId);

  const cancel = waitForTicketAuthorization(ticketId, (err, authorizedTicketId) => {
    authWindow.close();

    if (err) {
      cb(err);
    } else if (authorizedTicketId) {
      exchangeTicketForToken(authorizedTicketId).then(token => cb(null, token), err => cb(err));
    }
  });

  return cancel;
}

// Actions requiring a Netlify access token:

export async function listSites(accessToken) {
  const sites = await get('/sites?page=1&per_page=100', accessToken);
  return sites.filter(site => {
    // We can only build sites with build configuration:
    const settings = site.build_settings;
    return null !== settings && typeof settings === 'object';
  });
}

export function createBuildHook(siteId, accessToken) {
  return post(`/sites/${siteId}/build_hooks`, accessToken, {
    title: 'Contentful integration'
  });
}

export function createNotificationHook(siteId, accessToken, { event, url }) {
  return post('/hooks', accessToken, {
    site_id: siteId,
    event,
    data: { url }
  });
}
