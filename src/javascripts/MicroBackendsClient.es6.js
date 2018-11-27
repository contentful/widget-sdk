'use strict';

import environment from 'environment';

const ENV_TO_URL_PREFIX = {
  development: '/_microbackends/backends/',
  staging: 'https://staging.ctffns.net/',
  // We don't have a separate preview environment.
  // Use staging instead.
  preview: 'https://staging.ctffns.net/',
  production: 'https://backends.ctffns.net/'
};

export default function createMicroBackendsClient({ backendName }) {
  return {
    url,
    call: (path, opts) => fetch(url(path), opts)
  };

  function url(path) {
    path = path || '/';
    path = path.startsWith('/') ? path : `/${path}`;
    const { env, gitRevision } = environment;
    const prefix = ENV_TO_URL_PREFIX[env];

    if (gitRevision) {
      return prefix + `_rev-${gitRevision}/${backendName}` + path;
    } else {
      return prefix + backendName + path;
    }
  }
}
