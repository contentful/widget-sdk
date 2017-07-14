# A/B Testing in the Contentful web app

## Quickstart

Create a test via the LaunchDarkly(LD) UI for the environment you are interested in. Then, in the directive you are running the A/B test, import `utils/LaunchDarkly` and use the `get` method to get the test stream to which you can add a handler. This handler will receive the test variation values if/as they change.

```js
// Begin A/B experiment code - test-teamname-mm-yy-test-name
var K = require('utils/kefir');
var LD = require('utils/LaunchDarkly');
var someTest$ = LD.getTest('test-teamname-mm-yy-test-name');

K.onValueScope($scope, someTest$, function (showTest) {
    if (showTest) {
      // test code
    } else {
      // control code
    }
});
// End A/B experiment code - test-teamname-mm-yy-test-name
```

The test code should _always_ be bound by comments in the format shown above to aid cleanup once the test is finished.

## Terminology

- `A/B test`: An A/B test is what you set up via LaunchDarkly's web app (note: it is called 'Feature flag' in LD interface, but we have a distinction between the two - see `Feature flag` below). We call a test with percentage variations and available only for qualified users, an `A/B test`, and a flag that is set for all users without a variation a `Feature flag`.
- `Variation`: A bucket for a test. We have `null` for unqualified users and `Boolean` for qualified users.
- `Default rule`: Rule that decides what qualified users receive as their variation for a test.
- `Feature flag`: A feature flag is set up in the same way as A/B tests in LaunchDarkly, but unlike an A/B test it should be always set to true or false *for all users* (no variations). It affects all users, not only qualified ones. They are described in detail in [a separate document](/docs/guides/feature-flags).

## Default qualification criteria
<span id="default-qualification-criteria"></span>

Only users that don't belong to _any_ paying/converted organization are qualified for A/B tests. What this means is that only these users will get a bucketed into a variation for a test.
All unqualified users receive `null` as the value for a test variation. Any other test specific qualification logic *must* be handled in the test code.

### Custom qualification criteria
Custom qualification criteria can be passed to the `get` method that the Launch Darkly integration exposes. It is applied along with the default qualification criteria.
Currently, there is no way to bypass the default qualification criteria.

```js
var K = require('utils/kefir');
var LD = require('utils/LaunchDarkly');
var someTest$ = LD.getTest('some-test', currentUser => false);

K.onValueScope($scope, someTest$, function (showTest) {
    // showTest will always be null since custom qualification
    // function returns false and hence disqualifies the user
});
```

## Environments on Launch Darkly

### `Development`
Tests and feature flags defined here are served to `app.joistio.com:8888` aka local dev

### `Staging`
Tests and feature flags defined here are served to `app.flinkly.com` aka `staging`

### `Preview`
Tests and feature flags defined here are served to `app.quirely.com` aka `preview`

### `Production`
Tests and feature flags defined here are served to `app.contentful.com` aka `production`


## Running an A/B test

We follow a promotion based approach to releasing an A/B test as outlined below.

1. The developer implementing the test creates the A/B test in the `Development` environment on LD
2. Once the developer opens a PR and wants the test available on our `staging` environment aka `flinkly`, he/she duplicates it from `Development` to `Staging` environment via the LD UI
3. Once the PR is merged to `master`, the developer duplicates it from `Staging` to `Production` environment via the LD UI

__Important__:

1. Please note that tests created in the `Staging` environment must have `false` as the default rule so that the automated tests can run successfully. This ensures that the automated tests don't see the test.
2. In the "If targeting is off" section, make sure there is no variation so that LD serves `null` when targeting is turned off.

### Naming

A test name should have the following format: `test-teamname-mm-yyyy-test-name`.

For example, `ps-03-2017-example-space-impact` where `ps` stands for `Team Product Success`.

Also, please add a link to the experiment wiki page in the description.
Please note that tests created in the `Staging` environment must have `false` as the default rule so that the automated tests can run successfully. This ensures that the automated tests don't see the test.

### Creating test

1. Switch to the environment you require in the LD UI
2. Goto Feature Flags and click New
3. In the pane that slides in, fill in the details and make sure you select "Make this flag available to the client-side (JavaScript) SDK"
4. Choose the default bucket split
5. Enable targeting to enable the test
6. The test should now be available in `user_interface` for [qualified users](#default-qualification-criteria)

![create feature flag](https://cloud.githubusercontent.com/assets/635512/23408313/e12ab360-fdc7-11e6-8b52-4cce064b1b2a.gif)


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
