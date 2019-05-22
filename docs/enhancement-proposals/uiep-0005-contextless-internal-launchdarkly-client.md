> id: UIEP-0005
>
> title: Contextless internal LaunchDarkly service
>
> champion(s): Joshua Smock (@jo-sm)
>
> end date: March 15, 2019
>
> status: Approved

# [UIEP-0005] Contextless internal LaunchDarkly client

## Motivation

Our current internal LaunchDarkly service (`/utils/LaunchDarkly/index.es6`) relies on the "current context", meaning the "current" space, organization, and user. The user data doesn't change during a session, but the space and organization data may change depending on what is considered the context, and this context can't be directly controlled in the code. This means that targeting a user with respect to a different organization or space than the "current context" isn't possible.

The proposed solution is to create a contextless internal LaunchDarkly service which allows passing in org and space IDs, meaning multiple contexts can be targeted within the same piece of code. One use case for this would be targeting for a new feature within the side panel (where the spaces show up) based on either the visible spaces, or the selected organization, such as environments.

## Other potential solutions

There aren't other potential solutions for the UI code due to the way that the LaunchDarkly client library (`ldclient-js`) works -- it only allows either instantiating a new instance of the client or identifying a different set of data for the user. This isn't a good solution as the context could change multiple times in the same view.

A potential non-UI code solution would be to use an internal service like the Product Catalog for a given UI feature, but for multiple reasons -- specifically for the Product Catalog, it is not meant to be used for feature flag style targeting, and an internal service is more complicated to maintain -- it makes more sense to rewrite our internal service.

## Migration path

Migration is straightforward -- most consumers of the service need additional space or org data within their code, meaning they have access to the org or space ID and can pass this to the new service as well. The way the service is used has no changes except for that:

```js
// Current way
const variation = await getCurrentVariation('feature-dv-11-2017-environments');

// New way
const variation = await getVariation('feature-dv-11-2017-environments', {
  orgId
});
```

### `onValueScope`

In the new implementation, `onValueScope` is not migrated and existing `onValueScope` uses will be migrated to `getVatiation`.

Although LaunchDarkly allows for watching a feature flag via `client.on`, in almost every case this is not how we would want our application to work. In every case that we're using `onValueScope` right now it's not to react to changes, but just so that `$scope` changes are applied after a feature flag variation is retrieved.

## Notes

I removed the `isExampleSpace` targeting rule since 1) it isn't used anymore, and 2) it keeps the code a lot simpler.
