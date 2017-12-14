# Feature flags with Launch Darkly

We use [LaunchDarkly](launch-darkly-app) for feature flags as well as A/B tests. You might also want to read [the document about A/B testing with Launch Darkly][a-b-testing-doc].

## Quickstart

Create a feature flag via the LaunchDarkly(LD) UI for the environment you are interested in. Then, in the directive where you are running the feature, import `utils/LaunchDarkly` and use the `getFeatureFlag` method to get the feature flag value stream to which you can add a handler. This handler will receive the feature flag values if/as they change.

```js
// Begin feature flag code - feature-teamname-mm-yy-feature-name
var K = require('utils/kefir');
var LD = require('utils/LaunchDarkly');
var someFeatureFlag$ = LD.getFeatureFlag('feature-teamname-mm-yy-feature-name');

K.onValueScope($scope, someFeatureFlag$, function (showFeature) {
    // showFeature has the same value of either true or false for all users at a time
});
// End feature flag code - feature-teamname-mm-yy-feature-name
```
The comments in the format shown above are required to aid cleanup once we ship the feature.

### Shorthand to bind feature flag value to scope variable

There is as a shorthand method for the most common scenario: binding value of feature flag to a scope variable:

```js
// Begin feature flag code - feature-x
var LD = require('utils/LaunchDarkly');
LD.setOnScope($scope, 'feature-x', 'featureX') // binds scope variable 'featureX' to value of feature flag 'feature-x'
// End feature flag code - feature-x
```

## Environments on Launch Darkly

### `Development`
Feature flags defined here are served to `app.joistio.com:8888` aka local dev

### `Staging`
Feature flags defined here are served to `app.flinkly.com` aka `staging`

### `Preview`
Feature flags defined here are served to `app.quirely.com` aka `preview`

### `Production`
Feature flags defined here are served to `app.contentful.com` aka `production`


## Running a feature flag

The general process for feature flag development is outlined below. Environments in LD are described in the [A/B testing document][a-b-testing-doc].

1. The developer implementing the feature creates the feature flag in the `Development` environment on LD
2. Once the developer opens a PR and wants the feature to be available on our `staging` environment aka `flinkly`, he/she duplicates it from `Development` to `Staging` environment via the LD UI, setting feature flag to `false`.
3. The PR is merged to `master` as soon as regression tests are passing. Once it is merged, the developer duplicates it from `Staging` to `Production` environment via the LD UI, setting it to `false`.
4. To be able to QA a feature on `quirely`, feature flag on `Preview` should be set to `true`.
5. Automated tests for the new feature are developed in a separate branch and run against Preview environment, when they are ready to be merged to master, the flag on Staging is set to `true`.
6. When we are ready to release the feature, the flag on production is set to `true`. If we choose to release only to some users, or do an A/B test with percentage rollout, that can be configured via Launch Darkly alone, no redeployment of code needed.
7. The feature flag code in webapp and the flag itself in LD will be eventually removed when the feature is well tested and we decide to keep it.

## Targeting rules

You can target users by their LD properties. The only two user properties are currently:

| Property name   | Type    | Description                                                                           |
|-----------------|---------|---------------------------------------------------------------------------------------|
| key             | String  | `user.sys.id`                                                                         |
| isNonPayingUser | Boolean | True if any of user's organizations is paying - such users are qualifed for A/B tests |


### Adding new user properties

It is possible to add custom properties to LD. But before doing so, *please discuss it with frontend chapter*! It is important for these reasons:

- Launch Darkly is a third party service that should not consume any sensitive user data as emails, names etc. To make sure that what you are going to send is ok, check it with Andy.
- If you send a new custom property to Launch Darkly, it will stay there forever and cannot be removed.


## Naming

A feature flag should have the following format: `[feature|test]-teamname-mm-yyyy-test-name`.

For example, `feature-ps-03-2017-example-space-impact`, where `ps` stands for Product Success team.

If it is an [A/B test](a-b-test0ng-doc), it should start with `test`, otherwise with `feature`.

#### Team abbreviations

This list should be updated by new teams using the Launch Darkly integration.

- Product Success (`ps`)
- Biz Velocity (`bv`)
- Dev Velocity (`dv`)

### Creating a feature flag

1. Switch to the environment you require in the LD UI
2. Goto Feature Flags and click New
3. In the pane that slides in, fill in the details and make sure you select "Make this flag available to the client-side (JavaScript) SDK"
4. Choose the default bucket split, if applicable
5. Enable targeting to enable the test
6. The test should now be available in `user_interface`

![create feature flag](https://cloud.githubusercontent.com/assets/635512/23408313/e12ab360-fdc7-11e6-8b52-4cce064b1b2a.gif)


### QA

To manually QA the new feature, it should be turned on for `Staging` in LD.

Automated tests for the developed feature should be in a separate branch and run against `Staging`, tests from `master` should run against `Preview` with the flag turned off. See [Running a feature flag](#running-a-feature-flag) for the description of the whole process


[a-b-testing-doc]: /docs/guides/a_b_testing
[launch-darkly-app]: https://app.launchdarkly.com
