# Contentful Web Application

<!-- MarkdownTOC autolink="true" -->

- [Contentful Web Application](#contentful-web-application)
  - [Introduction](#introduction)
  - [Quickstart](#quickstart)
  - [Running and developing](#running-and-developing)
    - [Setting up `git`](#setting-up-git)
      - [Necessary configuration](#necessary-configuration)
      - [Other git configurations](#other-git-configurations)
    - [Running the app](#running-the-app)
      - [Setting up HTTPS (and handling CORS)](#setting-up-https-and-handling-cors)
      - [Notes and limitations](#notes-and-limitations)
    - [Running the tests](#running-the-tests)
      - [Jest](#jest)
      - [Cypress](#cypress)
      - [Additional documentation](#additional-documentation)
    - [Running a full Contentful instance](#running-a-full-contentful-instance)
    - [e2e tests](#e2e-tests)
      - [Running an e2e PR with a UI branch](#running-an-e2e-pr-with-a-ui-branch)
  - [Component library](#component-library)

<!-- /MarkdownTOC -->

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

#### Necessary configuration

Before you get started with development, ensure your local `git` environment is set
up correctly. The only thing that you need set up is your `git` email config.
If you haven't done this already, run the following command:

```
git config --global user.email <email goes here>
```

If you want to prevent your personal email from getting into the commits, you can use
your [noreply Github email](https://github.com/settings/emails).

Note: the email here must be added to your Github account. This means that if you use your Contentful
email, make sure it's added to your Github account or else your commits won't appear correct.

#### Other git configurations

If you often rebase your branches against master (or another branch) and are working on the same pieces of
code within your team, you may experience the same rebase conflicts over and over. By default you'll need
to resolve these each time you rebase, which can be annoying. To reduce the need to solve the same rebases
over and over, you can enable recorded resolution reuse mode, or `rerere`. To enable, run the following command:

```
git config --global rerere.enabled 1
```

For more information about `git rerere`, please see [the official documentation](https://git-scm.com/docs/git-rerere).

### Running the app

The `user_interface` can be served locally as a stand-alone app by using the preview,
staging, and production APIs. To do so, first the following conditions must be true:

- You must be a member of the [“Frontend” team][gh-fe-team] or any other team
  on Github that has access to the required private repositories
- You must be a member of the [“Frontend” team][npm-fe-team] on NPM or any
  other team that has access to the required repositories
- You must have [NVM][nvm] installed
- You must have an account on our staging environment `app.flinkly.com`.

If you don't have an account, use `bootstrap` as "Coupon Code" to setup a new account.

Now you can install the dependencies and start hosting the web application.

```js
nvm use
npm login
npm install
npm run dev-staging
```

While this is starting, go to the `app.flinkly.com` and sign in. Once signed in, you'll need to get the
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

You may also wish to use the internal [web app development browser extension](https://github.com/contentful/web-app-dev-extension),
which handles this detail as well as simplifies setting feature flags using `ui_enable_flags`.

#### Setting up HTTPS (and handling CORS)

Some features (such as secure assets) require that you're running your
development environment as an HTTPS server. This is typically somewhat
challenging, but there are tools that make this easier.

Process:

1. Install [`mkcert`](https://github.com/FiloSottile/mkcert#installation). This
   tool will install a new root CA in your operating system, and then allow you
   to create trusted certificates for any domain you'd like. Make sure you've
   run `mkcert -install` after installing the tool itself.

2. Create a new certificate pair for `*.joistio.com`:

   ```sh
   # mkcert '*.joistio.com'
   ```

   This will create two files in your local directory:
   `_wildcard.joistio.com-key.pem` and `_wildcard.joistio.com.pem`.

   Note: `joistio.com` is a domain (with some subdomains, like `app.joistio.com`)
   controlled by Contentful that simply points to localhost (127.0.0.1). When
   we do CORS checks, this domain is typically whitelisted. You could also make
   a cert just for `localhost`, but this might get trickier with subdomains,
   and probably doesn't work with CORS, which is why we recommend a
   `joistio.com` domain.

3. If you're using, for example, `app.joistio.com:3001` to access the app,
   then lazy-loaded chunks from webpack will fail to load unless your
   configuration's `assetUrl` is set to `https://app.joistio.com:3001/`. You
   can modify, for example, the `config/dev-on-staging.json` to suit.

4. Run the server with the cert/key file specified. You can launch the dev
   server and set the `HTTPS_KEY_FILE` and `HTTPS_CERT_FILE` environment
   variables to launch as an HTTPS (rather than HTTP) server. For example:

   ```sh
   # env \
       HTTPS_KEY_FILE=./_wildcard.joistio.com-key.pem \
       HTTPS_CERT_FILE=_wildcard.joistio.com.pem \
       npm run dev-staging \
       -- --public app.joistio.com:3001
   ```

5. Visit `https://app.joistio.com:3001/#access_token=<your access token>`. This
   should resolve to your machine (127.0.0.1). You should be able to login per
   usual, and any features that require HTTPS security and CORS from an official
   Contentful domain should be functional.

6) (Optional) If you always want to run the server in HTTPS mode, you can add
   these options to a `.envrc` file and use [`direnv`](https://direnv.net/) to
   automatically set these environment variables when you're in the
   `user_interface` project.

   Example `.envrc`:

   ```sh
   export HTTPS_KEY_FILE="$PWD/_wildcard.joistio.com-key.pem"
   export HTTPS_CERT_FILE="$PWD/_wildcard.joistio.com.pem"
   ```

   Don't forget to `direnv allow` after modifying your `.envrc` file!

#### Notes and limitations

- Note that you cannot login using the "normal" flow, e.g. by signing in locally. You
  can only login using `localhost:3001#access_token=<your access token>`.
- Don't use an access token you created yourself; use the token that comes from session storage. The way that
  our APIs handle user created tokens and login generated ones is a bit different and you will get cryptic issues
  if you use one you created.

### Running the tests

We have tests in a few different frameworks: Jest and Cypress. Jest is for our unit and React component tests,
and Cypress is for our integration and contract tests..

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

If you see an error that looks like "No version of Cypress is installed in: ..."
then you need to actually install the Cypress runner (which is not installed
when you `npm install`). To do this, run:

```sh
> npx cypress install
```

#### Additional documentation

- [Running tests with Jest](./docs/guides/testing-jest.md)
- [Running tests with Cypress](./docs/guides/testing-cypress.md)
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
