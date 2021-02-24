# Smoke tests

The tests in this directory are for testing critical functionality (critical paths) of the web app.

For more information, please see the Confluence documentation on [the critical paths](https://contentful.atlassian.net/wiki/spaces/ENG/pages/2785312930/WIP+Critical+paths+of+the+web+app) and [smoke tests](https://contentful.atlassian.net/wiki/spaces/ENG/pages/2794029205/WIP+Web+app+smoke+tests).

# Running smoke tests

Before running the smoke tests, ensure that the password (and optionally the email) for the account used for testing is available in your environment with the `SMOKE_TEST_USER_PASSWORD` variable. By default, the account email is `test@contentful.com`, and the password is available in 1password. If you don't set this password Cypress will err and tell you what the problem is.

The simplest way to run the smoke tests is using the `npm` task:

```
export SMOKE_TEST_USER_PASSWORD="..."

npm run smoke # runs against contentful.com
npm run smoke-staging # runs against flinkly.com
```

## Running against a different environment

If you'd like to run against a different environment, like `quirely.com`, you can run the following command from the project root:

```
SMOKE_TEST_DOMAIN='quirely.com' npm run smoke
```

**Please note** that the account you use must not have 2FA enabled, or else the tests won't work correctly.
