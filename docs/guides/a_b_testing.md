# A/B Testing in the Contentful web app

We use [LaunchDarkly](launch-darkly-app) for A/B tests as well as for feature flags. Please read the [doc on feature flags](feature-flags-doc) before this one.


## Terminology

- `A/B test`: We call a feature flag with percentage variations that is available only for qualified users, an `A/B test`.
- `Qualified user` aka `non-paying user`: Only users that don't belong to _any_ paying/converted organization are qualified for A/B tests. Every A/B test *must* be set up in Launch Darkly so that only users with property `isNonPayingUser=true` can receive a `true` test value.
- `Variation`: A bucket for an A/B test. It is `Boolean`, and must always be `false` for non-qualified users.
- `Default rule`: Rule that decides what all users that don't fit any custom targeting rules will receive as their variation for a test.

## Qualification criteria
<span id="default-qualification-criteria"></span>

Only users that don't belong to _any_ paying/converted organization (in LD `isNonPayingUser=true`) must be qualified for A/B tests. What this means is that only these users will get a bucketed into a variation for a test and all unqualified users will receive `false` as the default rule for a test variation.

Any other test specific qualification logic must be either derived from existing user properties on LD, or handled in the test code via _custom qualificationcriteria_ - see below.

### Custom qualification criteria
There is an option to pass a custom qualification criteria to the `LD#getFeatureFlag` method. It overrides *any* targeting rules on LD side: i.e. if qualification function returns `false` for user with `id=1`, he will *always* receive `null` as test value.

```js
var K = require('utils/kefir');
var LD = require('utils/LaunchDarkly');
var someTest$ = LD.getTest('some-test', currentUser => false);

K.onValueScope($scope, someTest$, function (showTest) {
    // showTest will always be null since custom qualification
    // function returns false and hence disqualifies the user
});
```

_Note:_

- This approach requires redeployment of code every time you change the criteria, or want to release the test for everyone. It should be used as a last resort if it is not possible to configure the desired behavior on LD side through existing user properties, and it is not possible to add a new one - see "Adding new user properties" in the [feature flags doc](feature-flags-doc).
- Custom qualfication criteria are currently not supported in `LD#setOnScope` method.


## Running an A/B test

We follow a promotion based approach to releasing an A/B test that is similar to what we have with feature flags. It is outlined below.

1. The developer implementing the test creates the A/B test in the `Development` environment on LD
2. Once the developer opens a PR and wants the test available on our `staging` environment aka `flinkly`, he/she duplicates it from `Development` to `Staging` environment via the LD UI
3. Once the PR is merged to `master`, the developer duplicates it from `Staging` to `Production` environment via the LD UI

__Important__:

1. Please note that tests created in the `Staging` environment must have `false` as the default rule so that the automated tests can run successfully. This ensures that the automated tests don't see the test.
2. In the "If targeting is off" section, make sure there is no variation so that LD serves `null` when targeting is turned off.

### Naming

A test name should have the following format: `test-teamname-mm-yyyy-test-name`.

For example, `test-ps-03-2017-example-space-impact` where `ps` stands for `Team Product Success` (see [feature flags doc](feature-flags-doc) for list of team name abbreviations).

Also, please add a link to the experiment wiki page in the description.


### Creating the test

A/B tests are created the same way as [feature flags](feature-flags-doc).

In the default bucket split, you *must* target only users with `isNonPayingUser=true` and serve `false` as default rule.

### Concluding the test
<span id="concluding-the-test"></span>

Tests should run for full 7 day intervals; at least 2 weeks but no more than 3 weeks.
Unless the experiment is receiving a low number of users or it is clearly having a negative impact on user experience, do not turn it off early.
It will be common that a significant difference was not observed in the duration of your test.

Once you conclude the test,

- If control (A) wins, then clean up the test code from the repository.
- If test (B) wins, then clean up the test code from the repository and implement it properly as a feature.

In LD, turn the test off (targeting -> off) and finally, document your findings.


## QA

As discussed with folks from the QA team, the idea is to not have automated tests for A/B tests since they are shortlived by definition. Instead, A/B tests will only undergo manual testing.

To facilitate this, all tests created in the `Staging` environment on LD should have `false` set as their default rule. This ensures that the automated tests never encounter any A/B tests.

As for manual QA, they can log in and manually force a flag for their user as shown below.
Doing this will send the flag value to the user in the environment they made the change.

![manual qa](https://cloud.githubusercontent.com/assets/635512/23408312/e10ff458-fdc7-11e6-97e5-56758cf8175a.gif)


To grab you user id, inspect the network tab in your browser's dev tools. Look for a call to `token`. The response for that should have a `user` property which in turn will have a `sys.id`. That is your user id as seen on LD.


## Analytics

Three golden rules of A/B testing analytics:

1. Never ship a test without identifying metrics that dictate success/failure.
2. Never ship a test without analytics in place.
3. Never conclude a test without measuring the results.

A Looker dashboard tracking the test should be made available soon after the test launch.

Every test should trigger an `experiment:start` event with the test id (as seen on LD and the one used in code) and variation when the user sees the experiment/interacts with the experiment. The "start" of the experiment is judged by the PO and the engineer developing the test.

```js
K.onValueScope($scope, someTest$, function (showTest) {
    // if the test "start" doesn't depend on a user action (e.g., page load)
    // then track directly in the onValueScope handler
    analytics.track('experiment:start', {
        experiment: {
            id: 'btn-test',
            variation: showTest
        }
    });

    // or if the test is initiated by a user action, track it based
    // on that action
    testBtn.click(function () {
        analytics.track('experiment:start', {
            experiment: {
                id: 'btn-test',
                variation: showTest
            }
        });
    });
});
```

There is no corresponding `experiment:end` event yet.


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

#### What about the possible skew in data due to users being bucketed eagerly?
It is accounted for on the BI side.

#### Why is the automated test suite breaking on my A/B test PR?
Maybe because the defaut value for your test is not set to false in the `Staging` environment on LD.

#### Who do I contact for dev related help?
Any frontend dev.

#### Who do I contact for analytics related help?
team-product-success

#### As a PO, how do I track how my test is doing?
Assuming you created a dashboard for your test, track its progress using that.
If not, create a dashboard.

#### When can I turn the test off?
[Read "Concluding the test"](#concluding-the-test)

#### What if my test had a bug?
Fix it and rename + restart the test, discarding the previous iteration's data.

[feature-flags-doc]: /docs/guides/feature-flags
[launch-darkly-app]: https://app.launchdarkly.com
