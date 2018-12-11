# micro-backends

This repository has [micro-backends](https://github.com/contentful/micro-backends) enabled.

micro-backends deploy small pieces of backend functionality to AWS Lambda. Code of the backends is living in the same repository. They are deployed and updated during the CI.

**DISCLAIMER**: This tech is experimental! Don't use for production-ready SLA-covered purposes.

## General into and programming model

The Web App uses the standard `@contentful/micro-backends` package with no deviations.

[Refer to the docs for more information](https://github.com/contentful/micro-backends#%CE%BC-backends)

## Accessing micro-backends locally

The micro-backends UI is available at `http://localhost:3001/_microbackends/`.

All micro-backends are kept in the `/micro-backends` directory in the root of this repository.

## Client module

There is a client module in this repository simplifying interactions with micro-backends:

```js
// Import the client factory function.
import createMicroBackendsClient from 'MicroBackendsClient.es6';

const backend = createMicroBackendsClient({
  // Required. Name of a backend to be called.
  // Available in the micro-backends UI.
  backendName: 'test',
  // Optional. If `true` it'll send the current
  // CMA token as a header.
  withAuth: true,
  // Optional. Defaults to `/`.
  baseUrl: `/spaces/${spaceId}`
});

// `.call` method takes a path (backend name and base URL skipped)
// and an object of options for `fetch`.
const res = await backend.call('/some/resource', { method: 'DELETE' });

// `res` is a `Response` instance returned by `fetch`.
assert(res.ok, true);
assert(res.status, 204);

// `.url` method takes a path (backend name and base URL skipped)...

const someResourceUrl = backend.url('/some/resource');

// ...and returns a full URL.
assert(
  someResourceUrl,
  'https://staging.ctffns.com/test/spaces/xyz/some/resource'
);
```

## Deployment

Deployment is configured and most likely doesn't need any further tweaks.

It's done with Travis' `script` deployment provider:

```yml
deploy:
  - provider: script
    script: ./micro-backends/.scripts/deploy.sh
    skip_cleanup: true
    on:
      all_branches: true
```

The deployment script uses the default "deploy all" mode of operation for `@contentful/micro-backends` which deploys all backends stored in `/micro-backends` (if there were changes).
