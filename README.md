# Contentful Web Application ![Production Build Commit](https://samson.contentful.org/projects/user_interface/stages/production.svg?token=8d70d6eaf8ef80c828d2f1472e89dc6d)

## Quickstart

Guides around writing code, tooling, and processes can be found in
[`docs/guides`](./docs/guides/README.md).

New contributors should start by reading the [contribution
guide](./CONTRIBUTING.md).

## Running and developing

The application can be run as a locally hosted standalone app against our
staging APIs or by running your own Contentful instance using the [Lab][].

### Running the standalone app

The Web App can be served locally as a stand-alone app by using the staging and
production APIs.

- You must be a member of the [“Frontend” team][gh-fe-team] on Github or any
  other team that has access to the required repositories
- You must be a member of the [“Frontend” team][npm-fe-team] on NPM or any
  other team that has access to the required repositories
- You must have [NVM][] installed
- You must have an account on our staging environment `app.flinkly.com`.

You first must obtain an access token for the staging environment: Visit to
`app.flinkly.com`, log in, and go to “APIs” → “Content management tokens”.
Create a new token and copy its value. You’ll need it later

Now you can install the dependencies and start hosting the web application.

```js
nvm use
npm login
npm install
NODE_ENV=dev UI_CONFIG=dev-on-staging ./node_modules/.bin/gulp all serve
```

Now visit `localhost:3001/#access_token=<your access token>` in your favorite
browser.

#### Limitations

Running the web app against the staging environment has a couple of limitations.
If you run into them you’ll need to run the application in the Lab.

- You cannot use the normal login flow. You can only use
  `localhost:3001/#access_token=<your access token>` to login.
- The Gatekeeper views cannot be shown.

[nvm]: https://github.com/creationix/nvm
[npm-fe-team]: https://www.npmjs.com/org/contentful/team/frontend
[gh-fe-team]: https://github.com/orgs/contentful/teams/frontend
[cf-auth-doc]: http://www.flinkly.com/developers/docs/references/authentication/#the-content-management-api

### Running the tests

- [Running tests with Jest](./docs/guides/testing-jest.md)
- [(Legacy) Running tests with Karma](./docs/guides/testing-karma.md)

### Running a full Contentful Instance

See the [Lab Readme][https://github.com/contentful/lab/blob/master/readme.md].

[lab]: https://github.com/contentful/lab/

## Styleguide and component library

If you want to add a general component that will be used across the app, you can add it to the [UI Component Library](https://github.com/contentful/forma-36). See their documentation on how to get started, or message in the `#project-design-system` Slack channel.

Additionally, we have a legacy styleguide, [available here](https://ctf-legacy-ui-styleguide.netlify.com/), which you can use for additional reference beyond the component library.
