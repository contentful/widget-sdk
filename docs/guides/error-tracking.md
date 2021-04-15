# Error tracking

This guide provides a high level explanation of what error tracking is in the web app, how to use it, and best practices. For any questions, please reach out to #dev-frontend.

# What is error tracking?

Error tracking, as the name implies, is a way for us to determine if something errant is occuring in the web app. We use it to see if something unexpectedly bad is happening (something unhandled), or if something expected but bad is happening (something handled). It also encompasses things that are bad but not at the level of an error, e.g. a warning.

It's worth noting early: **error tracking is not informational logging**. To log something informational, please use our analytics or telemetry setups, depending on your use case. The reasons for treating error tracking separately are described below in the best practices section.

# How do I track an error?

We use Sentry as our error tracking tool across the entire organization, and the web app is no exception (you may see references to Bugsnag but this tool isn't used anymore). You can access Sentry via Okta (using SSO); if you don't have access you can contact IT to get an account.

To track an error, you can use the logger service located at [`services/logger`](../../src/javascripts/services/logger.ts). It provides two methods: `captureError` and `captureWarning`. They function exactly the same, the difference being that in the Sentry UI, errors appear red while warnings appear yellow.

You can capture error instances, and any additional metadata using the provided functions:

```javascript
// Assume `error` is an Error instance
logger.captureError(error, {
  organizationId,
  spaceId,
});

// `captureWarning` works the same way
logger.captureWarning(error, {
  organizationId,
  spaceId,
});
```

# Best practices

## Capture errors, not information

As mentioned above, error tracking should be treated as something that's used to capture unexpected or buggy things in the app, rather than logging information.

There are two main reasons for this:

1. Logging information in Sentry adds noise and drowns out otherwise useful errors.
2. It is possible to rate limit the _entire organization_ in Sentry if too much stuff is logged.

A specific example: in late March 2021, a logged error caused over [7000 messages in around 3 hours](https://contentful.slack.com/archives/C029BE16E/p1616516254077500), and the only reason it didn't grow even more was because Sentry rate limited all errors for an hour and it was off-peak time. In practical terms, for that hour no services across the entire engineering organization had any errors logged, and the solution was ultimately to discard the logged error.

Most cases will not be so significant, but it illustrates the point that you should be cognizant of what you're logging, to not log just anything in Sentry, and definitely not log informational things, instead preferring [analytics](../../src/javascripts/analytics/Analytics.ts) or [telemetry](../../src/javascripts/i13n/Telemetry.js).

## Capture untransformed errors

It's recommended that you **capture caught errors "raw"**, in an untransformed way. This will often give you more insight into what's going on than a blanket / generic error message and will make filtering in the Sentry UI easier.

```javascript
// Not recommended
try {
  somethingThatThrows();
} catch (err) {
  logger.captureError(new Error('an error message'), {
    message: err.message,
  });
}

// Recommended
try {
  somethingThatThrows();
} catch (err) {
  logger.captureError(err);
}
```

## Track Error instances

Although you should log "raw" errors, sometimes those raw errors aren't actually Error instances. Since it's possible to throw anything in JS, you'll likely encounter situations where an object, primitive, etc., is thrown. In cases like this, you should make an Error instance yourself and capture the thrown entity as metadata. The main reason for this is that Sentry expects an Error instance when logging, and if it gets something else, like a message or an object, the message shown in the interface will be basically useless.

If you used our Bugsnag setup before, you may remember that you could log both messages and error instances. This isn't really supported in Sentry, and will make understanding the error in the Sentry UI more challenging, so for this and the reasons listed above, it's advised to **always log error instances**.

```javascript
// Bad
logger.captureError('oops something bad happened');

// Also bad
try {
  somethingThatThrowsAnObj();
} catch (obj) {
  logger.captureError(obj);
}

// Good
logger.captureError(new Error('oops something bad happened'));

// Also good
try {
  somethingThatThrowsAnObj();
} catch (obj) {
  logger.captureError(
    new Error('Unexpected error when caling somethingThatThrowsAnObj', {
      capturedObject: obj,
    })
  );
}
```

## Asynchronous errors

You may sometimes need to capture an error that happens after you're dealing with a promise, either in a `.then` block or after `await`. When this happens, like if an error is thrown, the stack trace is lost and if you would rely on the stack trace to understand what's going on it's impossible. To mitigate this, if you need to get the stack trace for an asynchornous action, you should create an error _before_ the `await` or `.then`:

```javascript
// The stack will be lost here
try {
  await somethingAsync();
} catch (err) {
  logger.captureError(err);
}

// To preserve the stack, instantiate the error earlier
const asyncError = new Error('Something went wrong while making this API call');

try {
  await somethingAsync();
} catch (err) {
  logger.captureError(asyncError, {
    message: err.message,
  });
}
```

It's worth noting that you _will not_ capture the stack after the error instantiation. Keep this in mind as the stack trace may look a bit strange in the Sentry UI.
