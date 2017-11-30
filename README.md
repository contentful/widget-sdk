# Contentful Web Application

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

* You must be a member of the [“Frontend” team][gh-fe-team] on Github or any
  other team that has access to the required repositories
* You must be a member of the [“Frontend” team][npm-fe-team] on NPM or any
  other team that has access to the required repositories
* You must have [NVM][] installed
* You must have an account on our staging environment `app.flinkly.com`.

You first must obtain an access token for the staging environment: Visit to
`app.flinkly.com`, log in, and go to “APIs” → “Content management tokens”.
Create a new token and copy its value. You’ll need it later

Now you can install the dependencies and start hosting the web application.

~~~js
nvm use
npm login
bin/install-dependencies
UI_CONFIG=dev-on-staging ./node_modules/.bin/gulp all serve
~~~

Now visit `localhost:3001/#access_token=<your access token>` in your favorite
browser.

#### Limitations

Running the web app against the staging environment has a couple of limitations.
If you run into them you’ll need to run the application in the Lab.

* You cannot use the normal login flow. You can only use
  `localhost:3001/#access_token=<your access token>` to login.
* The Gatekeeper views cannot be shown.

[NVM]: https://github.com/creationix/nvm
[npm-fe-team]: https://www.npmjs.com/org/contentful/team/frontend
[gh-fe-team]: https://github.com/orgs/contentful/teams/frontend
[cf-auth-doc]: http://www.flinkly.com/developers/docs/references/authentication/#the-content-management-api


### Running the tests

You need to have Chrome installed and CHROME_BIN environment value set to Chrome executable path.

~~~bash
$ npm install -g karma-cli gulp-cli
$ gulp prepare-tests
$ karma start
~~~

For more information, see the [testing guide](./docs/guides/testing.md)


### Running a full Contentful Instance

See the [Lab Readme][].

[Lab]: https://github.com/contentful/lab/

## Styleguide

The styleguide is generated automatically when running `gulp serve` and
is served by gulp at `/styleguide`.

Styleguide is published on both preview and staging.

If you wish to generate it manually, you can run `gulp
generate-styleguide` and then check `public/styleguide`

Don't forget to provide an appropriate commit message outlining the changes.
