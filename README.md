# Contentful Web Application ![Production Build Commit](https://samson.contentful.org/projects/user_interface/stages/production.svg?token=8d70d6eaf8ef80c828d2f1472e89dc6d)

## Introduction

The `user_interface`, also called the **Web App**, is the user facing application
for editing and managing content, administering spaces and organizations, and
your Contentful user account.

## Quickstart

Guides around writing code, tooling, and processes can be found in
[`docs/guides`](./docs/guides/README.md).

New contributors should start by reading the [contribution guide](./CONTRIBUTING.md).

## Running and developing

The application can be run as a locally hosted standalone app against our
preview and staging APIs or by running your own Contentful instance using
the [Lab][lab].

### Setting up `git`

Before you get started with development, ensure your local `git` environment is set
up correctly. The only thing that you need set up is your `git` email config.
If you haven't done this already, run the following command:

```
git config --global user.email <email goes here>
```

You can use any email tied to your Github account, but if you want to prevent your
personal email from getting into the commits, you can use your [noreply Github email](https://github.com/settings/emails).

### Running the app

The `user_interface` can be served locally as a stand-alone app by using the preview,
staging, and production APIs. To do so, first the following conditions must be true:

- You must be a member of the [“Frontend” team][gh-fe-team] or any other team
  on Github that has access to the required private repositories
- You must be a member of the [“Frontend” team][npm-fe-team] on NPM or any
  other team that has access to the required repositories
- You must have [NVM][nvm] installed
- You must have an account on our staging environment `app.flinkly.com`.

Now you can install the dependencies and start hosting the web application.

```js
nvm use
npm login
npm install
npm run dev-staging
```

Next, go to the `app.flinkly.com` and sign in. Once signed in, you'll need to get the
`access token`, which is in session storage. Copy its value, and then visit

```
localhost:3001/#access_token=<your access token>
```

in your browser.

To make this easier, you can add the following bookmark in your browser:

```
javascript:window.location.href=`http://localhost:3001${window.location.pathname}#access_token=${window.sessionStorage.getItem('token')}`
```

- Go to [app.flinkly.com](https://app.flinkly.com)
- Click on the bookmark
- Start developing!

#### Limitations

Note that you cannot login using the "normal" flow, e.g. by signing in locally. You
can only login using `localhost:3001#access_token=<your access token>`.

### Running the tests

We have tests in a few different frameworks: Jest, Cypress, and Karma. Jest is for our unit and React component tests,
and Cypress is for our integration and contract tests. Karma has a mix of both, but is deprecated and you should
prioritize migrating Karma tests to Jest (or possibly Cypress) as much as is feasible.

#### Jest

To run the Jest tests, simply run `npm run jest`.

#### Cypress

To run the Cypress tests, first you need to start the application in "localhost" mode, and then start the Cypress
application. Note that it requires Chrome to be available on your computer.

```
> NODE_ENV=dev UI_CONFIG=localhost npm start

# In another terminal...

> npm run cypress
```

#### Karma

To run the Karma tests, simply run `npm test` and go get a coffee, a tea, or a beer, because the tests
are as slow as molasses in Kansas in the middle of winter -- meaning, they take a while to run.

#### Additional documentation

- [Running tests with Jest](./docs/guides/testing-jest.md)
- [Running tests with Cypress](./docs/guides/testing-cypress.md)
- [(Deprecated) Running tests with Karma](./docs/guides/testing-karma.md)
- [Security and Compliance Tests in CI](./docs/guides/security_and_compliance.md)

### Running a full Contentful instance

See the [Lab (api_integration_suite) repository][lab].

### e2e tests

In addition to the tests mentioned above, we do have an end-to-end (E2E) test suite, which runs a series of tests
inside of the Lab environment. For more details about the tests and how to run them, please go to the [e2e-tests repository][e2e].

#### Running an e2e PR with a UI branch

Sometimes you'll run into the situation where your changes affect the e2e tests and you need to test your changes
against changes you make in the e2e tests. While you'll inevitably need to run the tests locally as you develop them,
you'll also want to make your e2e PR run against your UI PR (so that your e2e PR gets a green check). To do so, name
your branches in the UI and the e2e tests identically.

## Component library

If you want to add a general component that will be used across the app, you can add it to the [Forma 36 component library][forma-36]. See their documentation on how to get started or message in the `#prd-forma-36` Slack channel.

[nvm]: https://github.com/creationix/nvm
[npm-fe-team]: https://www.npmjs.com/org/contentful/team/frontend
[gh-fe-team]: https://github.com/orgs/contentful/teams/frontend
[cf-auth-doc]: http://www.flinkly.com/developers/docs/references/authentication/#the-content-management-api
[lab]: https://github.com/contentful/api_integration_suite
[e2e]: https://github.com/contentful/e2e-tests
[forma-36]: https://github.com/contentful/forma-36
