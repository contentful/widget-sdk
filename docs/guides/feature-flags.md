# Feature flags in the Contentful web app

We use [LaunchDarkly][launch-darkly-app] for feature flags as well as [A/B tests][a-b-testing-doc].

## Terminology

- `Feature flag`: A boolean flag in LaunchDarkly
- `Qualified user`: A qualified user is any user that matches configured targeting rules in LaunchDarkly.
- `Variation`: Either `true` or `false` for a feature flag
- `Default rule`: Rule that decides what all users that don't fit any custom targeting rules will receive as their variation for the given flag.

## Creating a feature flag

1. Login to [LaunchDarkly][launch-darkly-app]
2. Choose the environment you want to create the flag in from the list on the top left corner
3. Navigate to `Feature Flags` section
4. Click `New +` button on the top right corner to create a new test
5. Type in a descriptive human readable name for your test (e.g., `Author Onboarding: Authors Help`)
6. Type in a value for key which follows the following format: `feature-teamname-mm-yyyy-test-name` (e.g., `feature-ps-12-2017-author-onboarding-help`)
7. In the `Description` box, enter a link to your feature wiki document
8. Add tags if you want to help group flags together
9. Under `What kind of flag is this?` choose `Boolean`
10. Check the option named `Make this flag available to the client-side (JavaScript) SDK`
11. Click `Save Flag`

You can then setup your targeting for your feature flag. Please note a few points about targeting.

1. The `Default rule` should always serve `false` for a feature flag
2. Each targeting rule is effectively an `and` condition. Multiple targeting rules are `or`-ed together
3. For your flag on `Staging` environment, please make sure you add a rule that serves `false` when `isAutomationTestUser` `is one of` `true` if the integration tests haven't been updated to include your feature.

## Implementing a test

Here's a dummy test using `onABTest` method from our LaunchDarkly integration.

```js
'use strict'

angular.module('contentful')

.directive('myCfDirective', ['require', function(require) {
  var template = require('myCfDirectiveTemplate').default
  var LD = require('utils/LaunchDarkly')
  var track = require('analytics/Analytics');
  var flagName = 'feature-ps-12-2017-author-onboarding-help'

  return {
    template,
    restrict: 'E',
    scope: {},
    controller: ['$scope', function ($scope) {
      LD.onFeatureFlag($scope, flagName, function (variation, changeInCtx) {
        if (variation) {
          // show feature
        } else {
          // hide feature
        }
      })
    }]
  }
}])
```

You can also use `LD.getCurrentVariation` to grab the variation for a test. It has different runtime semantics and might even be the better choice for your code. Have a look at [the source of our LaunchDarkly integration][ld-integration] which details the behaviour as well as guarantees provided by each method.

## Targeting rules

The best place to check the attributes available to target users is [in our LD integration][ld-integration] but it will also be maintained in the [FAQ section of our A/B testing guide][a-b-testing-doc-targeting].

### Adding new targeting attributes

It is possible to add custom properties to LD. But before doing so, *please discuss it with frontend chapter*! It is important for these reasons:

- Launch Darkly is a third party service that should not consume any sensitive user data as emails, names etc. To make sure that what you are going to send is ok, check it with Andy.
- If you send a new custom property to Launch Darkly, it will stay there forever and cannot be removed.

## QA

If automated tests exists for your feature, work with a QA engineer to run the right version of the integration suite against your branch.
If automated tests do not exist for your feature, then in your flag on `Staging` environment on LD, please make sure you add a rule that serve `false` when `isAutomationTestUser` `is one of` `true` so as to not break our automated test suite.

### Enabling flags

To QA manually, you can pass the flag name using a query parameter to our webapp. The parameter is called `ui_enable_flags` and accepts a list of LaunchDarkly test/flag names. Example: `ui_enable_flags=feature-ps-12-2017-author-onboarding-help`

### Disabling flags

Similar to enabling flags, you can disable specific flags by passing a flag using the query parameter called `ui_disable_flags`. It accepts a list of LaunchDarkly test/flag names in the same way as in the enabling flags. This will automatically return `false` for all specified flags. Example: `ui_disable_flags=feature-ps-12-2017-author-onboarding-help`

## Running

1. Deploy your code
2. In the `Production` environment on [LaunchDarkly][launch-darkly-app], navigate to your feature and toggle `Targeting` to `on`

[a-b-testing-doc]: ./ab-testing.md
[a-b-testing-doc-targeting]: ./ab-testing.md#targeting-attributes
[launch-darkly-app]: https://app.launchdarkly.com
[ld-integration]: ../../src/javascripts/utils/LaunchDarkly/index.es6.js
