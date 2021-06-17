# Feature flags in the Contentful web app

We use [LaunchDarkly][launch-darkly-app] for feature flags as well as [A/B tests][a-b-testing-doc].

## Terminology

- `Feature flag`: A defined configuration for a variation (see below) in LaunchDarkly
- `Qualified user`: A qualified user is any user that matches configured targeting rules in LaunchDarkly.
- `Variation`: A value for a feature flag depending on the "qualified user". It is generally `true` or `false, but may be any value.
- `Default rule`: Rule that decides what all users that don't fit any custom targeting rules will receive as their variation for the given flag.

## Creating a feature flag

### The LaunchDarkly side

1. Login to [LaunchDarkly][launch-darkly-app]. If you don't have access, put in an IT ticket first, or ask a teammate to help you.
2. Navigate to `Feature Flags` section.
3. Click `New +` button on the top right corner to create a new test.
4. Type in a descriptive human readable name for your test (e.g., `[Biz Stakeholders] New pricing flow`).
5. Type in a value for key which (roughly) follows the following format: `feature-<team or group name>-mm-yyyy-test-name` (e.g., `feature-ogg-05-2020-new-payment-flow`).
6. In the `Description` box, enter a description to help others understand the purpose of the flag.
7. Add tags if you want to help group flags together.
8. Under `What kind of flag is this?` choose the kind of flag it is. In general you can choose `Boolean`.
9. Check the option named `Make this flag available to the client-side (JavaScript) SDK`.
10. Click `Save Flag`.

You can then setup your targeting for your feature flag. Please note the following points about targeting.

1. The `Default rule` should be whatever is appropriate for your flag when the user is not being targeted. In general this is `false`.
2. Each targeting rule is effectively an `and` condition. Multiple targeting rules are `or`-ed together.

### The `user_interface` side

After setting the flag up in LaunchDarkly, you must then add it to the `FLAGS` map and define a fallback value.

### FLAGS map

Add the flag to the `FLAGS` object in [core/feature-flags](src/javascripts/core/feature-flags/flags.ts). Give the key a useful name, and the value is the LaunchDarkly flag key.

### Fallback values

**You must define a fallback value for your flag, without exception**. This is so that in the event that LaunchDarkly is unavailable or can't be reached for some reason, the user can still access the app, in a degraded state. You can think of the fallback value as if the variation were turned off.

Choose whatever fallback value you prefer and add it to [core/feature-flags](src/javascripts/core/feature-flags/flags.ts). Not doing so will cause the app to err when loading.

## Targeting rules

The best place to check the attributes available to target users is [in our LD integration][ld-integration].

### Adding new targeting attributes

It is possible to add additional custom properties to LD. But before doing so, please keep in mind the following:

- LaunchDarkly is a third party service that should not consume any sensitive user data (PII), such as emails and names. If you have any doubts that the data you're planning to send is considered sensitive or PII, reach out to the frontend chapter or the security team.
- If you send a new custom property to LaunchDarkly, it will stay there forever and cannot be removed.

### Enabling flags

To test manually you can pass the flag name using the query parameter `ui_enable_flags` in the URL. `ui_enable_flags` accepts a list of LaunchDarkly test/flag names. Example: `ui_enable_flags=flag-name-1,flag-name-2`

### Disabling flags

Same as above, except with `ui_disable_flags`. Example: `ui_disable_flags=flag-name-1,flag-name-2`

## In production

1. Deploy your code
2. In the `Production` environment on [LaunchDarkly][launch-darkly-app], navigate to your feature and toggle `Targeting` to `on`.

[a-b-testing-doc]: ./ab-testing.md
[launch-darkly-app]: https://app.launchdarkly.com
[ld-integration]: ../../src/javascripts/LaunchDarkly.js
