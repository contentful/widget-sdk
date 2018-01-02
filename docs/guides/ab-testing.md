# A/B Testing in the Contentful web app

We use [LaunchDarkly][launch-darkly-app] for A/B tests as well as for [feature flags][feature-flags-doc].

## Terminology

- `A/B test`: We call a flag with percentage variations that is available only for qualified users, an `A/B test`.
- `Qualified user`: A qualified user is any user that matches configured targeting rules in LaunchDarkly.
- `Variation`: A bucket for an A/B test. It can be one of  `true` or `false` for qualified users and _must_ be `null` for all other users.
- `Default rule`: Rule that decides what all users that don't fit any custom targeting rules will receive as their variation for the given flag.
- `Multivariate test`: We call a flag that has more than two variations a multivariate test. All A/B tests are created as multivariate tests so that we can define three distinct values, namely, `true`, `false` and `null`

## Creating an A/B Test

1. Login to [LaunchDarkly][launch-darkly-app]
2. Choose the environment you want to create the test in from the list on the top left corner
3. Navigate to `Feature Flags` section
4. Click `New +` button on the top right corner to create a new test
5. Type in a descriptive human readable name for your test (e.g., `Dev Onboarding: Example Space Impact`)
6. Type in a value for key which follows the following format: `test-teamname-mm-yyyy-test-name` (e.g., `test-ps-03-2017-example-space-impact`)
7. In the `Description` box, enter a link to your A/B test wiki document
8. Add tags if you want to help group tests together
9. Under `What kind of flag is this?` choose `Multivariate`
  a. Set variation 1 and name as `true` (test bucket)
  b. Set variation 2 and name as `false` (control bucket)
  c. Set variation 3 and name as `null` (disqualified user)
10. Check the option named `Make this flag available to the client-side (JavaScript) SDK`
11. Click `save flag`

You can then setup your targeting for your test. Please note a few points about targeting.

1. Please make sure all your targeting conditions have `isNonPayingUser` set to `is one of` `false` so that we show A/B tests only to non-converted users
2. The `Default rule` should always serve `null` for an A/B test
3. Each targeting rule is effectively an `and` condition. Multiple targeting rules are `or`-ed together
4. For your flag on `Staging` environment, please make sure you add a rule that serve `false` when `isAutomationTestUser` `is one of` `true` so as to not break our automated test suite

## Implementing a test

Here's a dummy test using `onABTest` method from our LaunchDarkly integration.

```js
'use strict'

angular.module('contentful')

.directive('myCfDirective', ['require', function(require) {
  var template = require('myCfDirectiveTemplate').default
  var LD = require('utils/LaunchDarkly')
  var flagName = 'test-ps-01-2018-alternate-my-cf-directive'
  var track = require('analytics/Analytics');

  return {
    template,
    restrict: 'E',
    scope: {},
    controller: ['$scope', function ($scope) {
      LD.onABTest($scope, flagName, function (variation, changeInCtx) {
        track('experiment:start', {
          experiment: {
            id: flagName,
            variation
          }
        })

        if (variation) {
          // show test
        } else {
          // show control
        }
      })
    }]
  }
}])
```

You can also use `LD.getCurrentVariation` to grab the variation for a test. It has different runtime semantics and might even be the better choice for your code. Have a look at [the source of our LaunchDarkly integration](../../src/javascripts/utils/LaunchDarkly/index.es6.js) which details the behaviour as well as guarantees provided by each method.

## Analytics

Three golden rules of A/B testing analytics:

1. Never ship a test without identifying metrics that dictate success/failure.
2. Never ship a test without analytics in place.
3. Never conclude a test without measuring the results.

A Looker dashboard tracking the test should be made available soon after the test launch.

Every test should trigger an `experiment:start` event with the test id (as seen on LD and the one used in code) and variation when the user sees the experiment with the experiment. The "start" of the experiment is judged by the PM and the engineer developing the test. For example:

```js
Analytics.track('experiment:start', {
  experiment: {
    id: TEST_NAME,
    variation
  }
})
```

We also have a lesser used `experiment:interaction` event which can be triggered when the user interacts with your experiment. For example:

```js
Analytics.track('experiment:interaction', {
  experiment: {
    id: TEST_NAME,
    variation,
    interaction_context: ctx
  }
})
```

## QA

As discussed with folks from the QA team, the idea is to not have automated tests for A/B tests since they are shortlived by definition. Instead, A/B tests will only undergo manual testing.
Therefore, for your flag on `Staging` environment, please make sure you add a rule that serve `false` when `isAutomationTestUser` `is one of` `true` so as to not break our automated test suite.

To QA manually, you can pass the flag name using a query parameter to our webapp. The parameter is called `ui_enable_flags` and accepts a list of LaunchDarkly test/flag names. Example: `ui_enable_flags=feature-dv-11-2017-environments`

## Running the test

1. Deploy your code
2. In the `Production` environment on [LaunchDarkly][launch-darkly-app], navigate to your test and toggle `Targeting` to `on`

## Concluding the test
<span id="concluding-the-test"></span>

Unless the experiment is receiving a low number of users or it is clearly having a negative impact on user experience, do not turn it off early.
It will be common that a significant difference was not observed in the duration of your test.

Once you conclude the test,

- If control (A) wins, then clean up the test code from the repository.
- If test (B) wins, then clean up the test code from the repository and implement it properly as a feature.

In LD, turn the test off (targeting -> off) and finally, document your findings.

## Considerations

1. Since everything from LaunchDarkly's end is async and we don't bootstrap feature flag data on our server side, the way we interact with the A/B testing API is async. We bootstrap feature flags on the frontend when the app is loading up.
Therefore, when the web app loads, it's always in variation A. When values for the feature flags arrive from LaunchDarkly's sdk, the experiments kick in. When these experiments activate, users might see the web app interface change under their feet.

2. Tests can very easily grow in scope. Please ensure that the metrics you want to track and measure success on are simple, few in number and not intertwined. Keep tests scope small and simple.

3. Avoid running multiple tests that interact with each other on the same views and/or components.

## FAQ

#### Who do I contact to get access to LD?
team-product-success

#### Why can I not see the test value in my code?
Double check if you made the feature flag available to the JavaScript client SDK.

#### Why is the automated test suite breaking on my A/B test PR?
Maybe because you aren't serving `false` for `isAutomationTestUser` `is one of` `true` on the `Staging` environment.

#### Who do I contact for dev related help?
Any frontend dev.

#### Who do I contact for analytics related help?
team-data

#### As a PM, how do I track how my test is doing?
Assuming you created a dashboard for your test, track its progress using that.
If not, work with team-data to have your needs met.

#### When can I turn the test off?
[Read "Concluding the test"](#concluding-the-test)

#### What if my test had a bug?
Fix it and rename + restart the test, discarding the previous iteration's data.

[feature-flags-doc]: ./feature-flags
[launch-darkly-app]: https://app.launchdarkly.com
