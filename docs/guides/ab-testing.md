# A/B Testing in the Contentful web app

We use [LaunchDarkly][launch-darkly-app] for A/B tests as well as for [feature flags][feature-flags-doc].

## Terminology

- `A/B test`: We call a flag with percentage variations that is available only for qualified users, an `A/B test`.
- `Qualified user`: A qualified user is any user that matches configured targeting rules in LaunchDarkly. These are the users that will be considered for the test. They should receive either `true` or `false` and never `null`.
- `Variation`: A bucket for an A/B test. It can be one of  `true` or `false` for qualified users and _must_ be `null` for all other users.
- `Default rule`: Rule that decides what all users that don't fit any custom targeting rules will receive as their variation for the given flag.
- `Multivariate test`: We call a flag that has more than two variations a multivariate test. All A/B tests are created as multivariate tests so that we can define three distinct values, namely, `true`, `false` and `null`

## Creating an A/B Test

1. Login to [LaunchDarkly][launch-darkly-app]
2. Choose the environment you want to create the test in from the list on the top left corner
  a. flags in the `Development` environment are used by lab and when you use `UI_CONFIG`
  b. flags in the `Staging` environment are served to `app.flinkly.com`
  c. flags in the `Preview` environment are served to `app.quirely.com`
  d. flags in the `Production` environment are served to `app.contentful.com`
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
11. Click `Save Flag`

You can then setup your targeting for your test. Please note a few points about targeting.

1. Please make sure all your targeting conditions have `isNonPayingUser` set to `is one of` `false` so that we show A/B tests only to non-converted users
2. The `Default rule` should always serve `null` for an A/B test
3. Targeting rules in a targeting block are effectively `and`-ed together. Targeting blocks are `or`-ed together.
4. For your flag on `Staging` environment, please make sure you add a rule that serves `false` when `isAutomationTestUser` `is one of` `true` so as to not break our automated test suite

## Implementing a test

Here's a dummy test using `onABTest` method from our LaunchDarkly integration.

```js
'use strict'

angular.module('contentful')

.directive('myCfDirective', ['require', function(require) {
  var template = require('myCfDirectiveTemplate').default
  var LD = require('utils/LaunchDarkly')
  var track = require('analytics/Analytics');
  var flagName = 'test-ps-01-2018-alternate-my-cf-directive'

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
Therefore, for your flag on `Staging` environment on LD, please make sure you add a rule that serve `false` when `isAutomationTestUser` `is one of` `true` so as to not break our automated test suite.

To QA manually, you can pass the flag name using a query parameter to our webapp. The parameter is called `ui_enable_flags` and accepts a list of LaunchDarkly test/flag names. Example: `ui_enable_flags=test-ps-03-2017-example-space-impact`

## Running the test

1. Deploy your code
2. In the `Production` environment on [LaunchDarkly][launch-darkly-app], navigate to your test and toggle `Targeting` to `on`

## Concluding the test

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
4. `getCurrentVariation` will resolve to `undefined` if the test/feature flag doesn't exist in LD or if LD itself is down.

## FAQ

#### Who do I contact to get access to LD?
team-product-success

#### What do the environments on LD map to?
They map 1:1 to our environments. E.g., Staging on LD maps to flinkly.

#### Why can I not see the test value in my code?
Double check if you made the feature flag available to the JavaScript client SDK.

If you dev against staging (without lab) then make sure your test flag is setup in the Development environment on LD.

#### Why is the automated test suite breaking on my A/B test PR?
Please make sure you are serving `false` for `isAutomationTestUser` `is one of` `true` on the `Staging` environment.

If that is not the case, please contact QA to get email of the user with failing tests and check what variation LD served for 'em in the LD interface for the `Staging` environment.

#### What attributes can I target the user on?
<span id="targeting-attributes"></span>
Custom attributes that can be used in targeting users:
- `currentOrgId` : current org in the app the user is in the context of
- `currentOrgSubscriptionStatus` : one of free, paid, free_paid, trial
- `currentOrgPlanIsEnterprise` : true if the current org is on an enterprise plan
- `currentOrgHasSpace` : true if the current org has a space
- `currentOrgPricingVersion`: the current organization pricing version, currently either `pricing_version_1` or `pricing_version_2`
- `currentUserOrgRole` : user's role in current org
- `currentUserHasAtleastOneSpace` : true if the user has atleast one space in all the orgs he/she is a member of
- `currentUserOwnsAtleastOneOrg` : true if the user is the owner of atleast one org
- `currentUserAge` : days since user signed up
- `currentUserIsCurrentOrgCreator` : true if the current org was created by the current user
- `currentUserSignInCount` : count of the number of times the current user has signed in
- `isNonPayingUser` : true if non of the orgs the user belongs to is paying us
- `currentUserSpaceRole` : list of lower case roles that user has for current space
- `isAutomationTestUser` : true if the current user was created by the automation suite

#### What are existing team name abbreviations?
- `ps` : Team Product Success
- `bv` : Team Business Velocity
- `dv` : Team Dev Velocity
- `at` : Team Authoring

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

#### When should I use a feature flag and when an A/B test flag?
This is based solely on what you want to achieve with your feature/release. The semantics of your feature/release
dictate whether you should use a feature flag or an A/B test flag.

Nevertheless, here are some common guidelines.

- If your flag has a rule where you serve a split (for e.g., 50/50) between `true` and `false`, you should probably be
using an A/B test flag.

- If you see that you are triggering `experiment:start` or `experiment:interaction` event, you should be using an A/B test
flag.

- If you want to do a controlled release of a feature which has no control variation that it is pit against,
use a feature flag. If you want to test a feature against some control, then use an A/B test flag.

[feature-flags-doc]: ./feature-flags.md
[launch-darkly-app]: https://app.launchdarkly.com
