# Contentful Web Application

## Quickstart

Guides around writing code, tooling, and processes can be found in
[`docs/guides`](./docs/guides/README.md).

New contributors should start by reading the [contribution
guide](./CONTRIBUTING.md).


## Running and developing

The application can be run from the [Lab][] or against the staging and
production APIs.

If you are using the Lab follow its readme to provision the VM using vagrant.
Then start the UI environment with
~~~
vagrant ssh
tmuxinator user_interface
~~~

[Lab]: https://github.com/contentful/lab/

### Using Staging and Production APIs

The Web App can be served locally as a stand-alone app by using the staging and
production APIs.

* You must be a member of the [“Frontend” team][gh-fe-team] on Github
* You must be a member of the [“Frontend” team][npm-fe-team] on NPM
* You must have [NVM][] installed

Now you can install the dependencies and start the server

~~~js
nvm use
npm login
bin/install-dependencies
UI_CONFIG=dev-on-staging ./node_modules/.bin/gulp all serve
~~~

The usual login flow does not work with this setup. You need to manually open
`localhost:3001/#access_token=<your access token>`.
The easiest way to obtain an access token is to use the [Contentful
authentication documentation][cf-auth-doc]. Alternatively you can inspect
`localStorage.token` in the browser console on `app.flinkly.com` when you are
logged in.


[NVM]: https://github.com/creationix/nvm
[npm-fe-team]: https://www.npmjs.com/org/contentful/team/frontend
[gh-fe-team]: https://github.com/orgs/contentful/teams/frontend
[cf-auth-doc]: http://www.flinkly.com/developers/docs/references/authentication/#the-content-management-api


## Showing API documentation

The repo comes with a self hosting API documentation and guides. To
view them run `gulp docs` and `gulp serve` and go to the
[`/docs`](http://app.joistio.com:8888/docs) folder of you development
server.

To continuously rebuild the documentation use `gulp docs/watch`.

## Styleguide

The styleguide is generated automatically when running `gulp serve` and
is served by gulp at `/styleguide`.

If you wish to generate it manually, you can run `gulp
generate-styleguide` and then check `public/styleguide`

If you wish to publish the styleguide, run `npm run publish-styleguide`, which
will generate the styleguide and publish it to the `gh-pages` branch which will
make it available as under <http://contentful.github.io/user_interface/>

Don't forget to provide an appropriate commit message outlining the changes.
