# Contentful UI Extensions SDK

The UI Extensions SDK is a JavaScript library that allows developers to create custom Contentful Apps
for the Contentful Web App. Every Contentful App has to include the library in its source.

## Resources

- [UI Extensions general documentation](https://www.contentful.com/developers/docs/extensibility/ui-extensions/)
- [UI Extensions SDK reference](https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/)
- [Contentful Apps Management HTTP API reference](https://www.contentful.com/developers/docs/references/content-management-api/#/reference/app-definitions)
- [Contentful Apps FAQ](https://www.contentful.com/developers/docs/extensibility/app-framework/faq/)
- [Contentful Apps repository](https://github.com/contentful/apps)
- [Contentful Marketplace](https://www.contentful.com/developers/marketplace/)
- [Contentful Changelog](https://www.contentful.com/developers/changelog/)
- [Forma 36: The Contentful Design System](https://f36.contentful.com/)
- [Forma 36 guide for Contentful Apps](https://www.contentful.com/developers/docs/extensibility/ui-extensions/component-library/)
- [`contentful-ui-extensions-sdk` at npm](https://www.npmjs.com/package/contentful-ui-extensions-sdk)
- [`create-contentful-app`](https://github.com/contentful/create-contentful-app) - CLI tool for developing apps without the hassle of managing build configurations

## Getting help

Technical questions, feedback or feature request can be provided directly through the Github issues
for this repository. However, if you are a paying customer or at any point business sensitive
information needs to be discussed, then the conversation should be handled via our
[support system](https://www.contentful.com/support/).

## Development

### publish

A new package version is automatically published to npm using [semantic-release](https://github.com/semantic-release/semantic-release).

To manually publish the package, run `node ./scripts/publish.js`.

We always publish two packages with identical data:

- `contentful-ui-extensions-sdk`
- `@contentful/ui-extensions-sdk`
