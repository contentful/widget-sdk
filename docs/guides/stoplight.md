Mocking the API with Stoplight
==============================

We use [Stoplight][stoplight] to describe API endpoints and mock the response.
You can ask in Slack #dev-frontend for an account.

Stoplight is a tool for API design that comes with a proxy (Prism) that lets
you mock and transform API responses. It is currently adopted by Ruby chapter
and Business Velocity team.

## Quick start

- Use query param `use_mock_api=<mock-api-id>` where `<mock-api-id>` is one
of `gatekeeper`, `comments`, `tasks` or `disco-labs` to route ALL requests
to the respective endpoint in Stoplight.
Once it's enabled, you should see a notification at the bottom right corner
in the web app and the dev console should show that all api requests now go
to urls like `https://pcfjmbizecazdxcwy.stoplight-proxy.io/token` instead
of `https://api.quirely.com/token`.

**Note:** For each stoplight endpoint this currently only works for either
quirely or flinkly, depending on the endpoint settings' Prism proxy setup
which can be configured to redirect requests to endpoints not mocked in
Stoplight to either https://api.quirely.com or https://api.flinkly.com

- Go to Stoplight and select the Contentful endpoint of your choice. Go to
API settings -> Prism -> Status. This is where you can configure to which
environment - quirely or flinkly - requests should be redirected.

## Current limitations

- Depending on Stoplight endpoint config, only works with quirely or flinkly
for now.
- Currently we only have Stoplight endpoints for a handful of endpoints and
more effort is needed to add the rest of the API.

## Client side mock XHR tool

If you want to quickly mock API response with an error code, you can also use
the client-side [mock XHR debug tool][mock-xhr-doc]. Its functionality is quite
limited but it can be useful for testing when you need to mock response from
arbitrary urls without an API schema in Stoplight. It also works on all dev
environments and does not affect other developers using Stoplight.


[stoplight]: https://stoplight.io/
