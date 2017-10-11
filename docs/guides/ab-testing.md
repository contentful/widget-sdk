# A/B Testing in the Contentful web app

We use [LaunchDarkly](launch-darkly-app) for A/B tests as well as for feature flags. Please read the [doc on feature flags](feature-flags-doc) before this one.

## Terminology

- `A/B test`: We call a flag with percentage variations that is available only for qualified users, an `A/B test`.
- `Qualified user`: A qualified user is any user that matches configured targeting rules in LaunchDarkly.
- `Variation`: A bucket for an A/B test. It can be one of  `true` or `false` for qualified users and _must_ be `null` for all other users.
- `Default rule`: Rule that decides what all users that don't fit any custom targeting rules will receive as their variation for the given flag.
- `Multivariate test`: We call a flag that has more than two variations a multivariate test. All A/B tests are created as multivariate tests to fit our use case.

## Creating an A/B Test

1. Login to [LaunchDarkly](launch-darkly-app)
2. Choose the environment you want to create the test in from the list on the top left corner
3. Navigate to feature flags section
4. Click `New +` button on the top right corner to create a new test
5. Type in a descriptive human readable name for your test
6. Type in a value for key which follows the following format: `test-teamname-mm-yyyy-test-name`



### Naming

A test name should have the following format:

For example, `test-ps-03-2017-example-space-impact` where `ps` stands for `Team Product Success` (see [feature flags doc](feature-flags-doc) for list of team name abbreviations).

Also, please add a link to the experiment wiki page in the description.


[feature-flags-doc]: /docs/guides/feature-flags
[launch-darkly-app]: https://app.launchdarkly.com
