# HTML Client App

## Preparations

Run `./Installfile`. This file ensures that both npm and bower modules are
installed.

## Gulp

To start developing, run `gulp clean` (optional), then `gulp all`.
That compiles all the files into the `public` directory.

Afterwards, run `gulp serve` to start the webserver on `localhost:3001`.
It'll serve the files from `public` every missing file will return
index.html.

The serve task also watches all javascript files, templates and
stylesheets and recompiles everything back into public as soon as
anything changes.

Not watched are the `user_interface` module and all the vendor stuff
(stylesheets and scripts). If you update one of those, run `gulp all`
again.

### Documentation

The repo comes with a self hosting API documentation and guides. To
view them run `gulp docs` and go to the
[`/docs`](http://app.joistio.com:8888/docs) folder of you development
server.

## Styleguide

The styleguide is generated automatically when running `gulp serve` and
is served by gulp at `/styleguide`.

If you wish to generate it manually, you can run `gulp
generate-styleguide` and then check `public/styleguide`

If you wish to publish the styleguide, run `npm run publish-styleguide`,
which will generate the styleguide and publish it to the `gh-pages`
branch which will make it available at [http://contentful.github.io/user_interface/](http://contentful.github.io/user_interface/).

Don't forget to provide an appropriate commit message outlining the
changes.

## Live Reloading

We have setup live reloading for CSS only, both in the app and the
styleguide. It uses [fb-flo](https://facebook.github.io/fb-flo/) so make
sure you install [the extension](https://chrome.google.com/webstore/detail/fb-flo/ahkfhobdidabddlalamkkiafpipdfchp).

Set it up by adding a new site in the Configuration pane, with settings:
- hostname pattern: app.joistio.com
- flo server hostname: 10.11.12.13
- flo server port: 9000

Once `gulp serve` is running, go to the flo tab in the developer tools
and make sure it has connected. The connection will probably drop when
you kill `gulp serve` so remember to refresh the page or click the "try
again" button.

## Builds and Deployment

We automatically deploy three branches to different hosts

* `preview` to `app.quirely.com`
* `staging` to `app.flinkly.com`
* `production` to `app.contentful.com`

Deployments are triggered by pushing commits to one of these branches.
First the push will trigger a build on Travis. On success, this will
run the `bin/trigger-packagebot` which will in turn tell the [package
bot][] to build a package. The package bot will run the `Packagefile`
script, collect all Debian packages and install them on the
corresponding server.

The package is created by `gulp build` and includes all the files
from the `build` directory. To test the build you can run `gulp
serve-production`

The built package still includes the dev host (i.e. `joistio.com`) in
its files. The are replaced on the servers by the `bin/process_hosts`
script.

If you wish to skip the tests on the `preview` environment for purposes
of showcasing unfinished work, you can add `[skip tests]` to your commit
message.

[package bot]: https://github.com/contentful/package-bot


## Client library development

If you are working on the client library and want to rapidly iterate and
see client library changes in the user interface build, use the `watchify`
task in combination with `serve`: `gulp watchify serve`

That will recompile the `user_interface.js` whenever you modify
something in the source tree.

The reason this is a separate task and not part of `serve` is that the
way browserify/watchify operate is pretty complicated, leads to
potential problems and modifying the client library is not something
that happens often anyway.

## Misc. npm tasks

### npm test

Used to run Tests on Travis in SlimerJS.

### npm run hint

Used to run jshint in the relevant directories.

### npm run cloc

Count Lines of Code. (Run `brew install cloc` to install cloc).

### npm run clean

Removes installed bower and node modules.

## Karma tests

To execute the unit tests, you need to install karma-cli globally:

    npm install -g karma-cli

Then just run `karma start`. Your tests are automatically watched and
re-run when you change them.

To select only a subsect of specs to run, replace their respective
`describe` or `it` call with `ddescribe` or `iit`.

For the available test reporters see [karma.conf.js#L43](https://github.com/contentful/user_interface/blob/master/karma.conf.js#L43) or `package.json`

If you use the `verbose` reporter you might want to set `set-option -g history-limit 5000` in your `tmux.conf`

## Acceptance tests

Those were deleted and can be found in pre-gulp revisions on the Repo.

They're supposed to be moved into the `ui_integration_test` repo.

Located under `spec/features`

On the main project directory:

1. `bundle exec rspec spec/features`

Possible ENV VARS:

- `USE_QUIRELY=true` to run against the integration server
  instead of localhost
- `USE_SAUCE=true` to use sauce labs instead of local firefox.
  Implies `USE_QUIRELY`

