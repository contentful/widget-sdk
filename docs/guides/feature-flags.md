# Feature flags with Launch Darkly

We use [LaunchDarkly](https://app.launchdarkly.com) for feature flags as well as A/B tests. Please see [this document][a-b-testing-doc] for details and terminology.

## Quickstart

You can create a feature flag in LD and use it in the same way as A/B test:

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

Feature flags don't have qualification criteria as in A/B tests - they are either off or on, for all users.

## Running a feature flag

The general process for feature flag development is outlined below. Environments in LD are described in the [A/B testing document][a-b-testing-doc].

1. The developer implementing the feature creates the feature flag in the `Development` environment on LD
2. Once the developer opens a PR and wants the feature to be available on our `staging` environment aka `flinkly`, he/she duplicates it from `Development` to `Staging` environment via the LD UI, setting feature flag to `false`.
3. The PR is merged to `master` as soon as regression tests are passing. Once it is merged, the developer duplicates it from `Staging` to `Production` environment via the LD UI, setting it to `false`.
4. To be able to QA a feature on `flinkly`, feature flag on `Staging` should be set to `true`.
5. When we are ready to release the feature, the flag on production is set to `true`.
6. The feature flag code in webapp and the flag itself in LD will be eventually removed when the feature is well tested and we decide to keep it.

### Naming

A feature flag should have the following format: `feature-teamname-mm-yyyy-test-name`.

For example, `feature-ps-03-2017-example-space-impact`.

### Creating a feature flag

The process is the same as for an A/B test, except that targeting should be set to off, and default rule must be either `true` or `false`.

### QA

To manually QA the new feature, it should be turned on for `Staging` in LD.

We don't cover features under a feature flag with automated tests, so if we want to run them against `Staging`, the feature should be disabled. This process can change in the future.


[a-b-testing-doc]: /docs/guides/a_b_testing
