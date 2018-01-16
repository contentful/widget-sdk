Mocking the API with Stoplight
==============================

We use [Stoplight][stoplight] to describe API endpoints and mock the response.
You can use the shared account in Shared-CF-Engineering folder in Lastpass or
get an individual one.

Stoplight is a tool for API design that comes with a proxy (Prism) that lets
you mock and transform API responses. It is currently adopted by Ruby chapter
and Business Velocity team.

## Quick start

- Use query param `use_mock_api=true` to route ALL requests to Stoplight. Once
it's enabled, you see in dev console that all api requests now go to urls
like `https://pcfjmbizecazdxcwy.stoplight-proxy.io/token` instead of
`https://api.quirely.com/token`.

Note: this setting currently works only with quirely api (`preview` and
`dev-on-preview` environments). This is until we include a standalone Stoplight
proxy in our lab setup.

- Go to Stoplight app and configure mocking. You can choose an individual
endpoint and select a status code under Mockng, or you can mock the entire API
via API settings -> Prism -> Global Mocking.

## Current limitations

- Works only with quirely for now
- Currently we only have Stoplight endpoints for gatekeeper subscription APIs
and some effort is needed to add the rest of the API.

## Client side mock XHR tool

If you want to quickly mock API response with an error code, you can also use
the client-side [mock XHR debug tool][mock-xhr-doc]. Its functionality is quite
limited but it can be useful for testing when you need to mock response from
arbitrary urls without an API schema in Stoplight. It also works on all dev
environments and does not affect other developers using Stoplight.


[stoplight]: https://stoplight.io/
[mock-xhr-doc]: ./debug.md
