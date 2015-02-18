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

### Production builds

To build the production version of the assets, run `gulp build`.
That'll put all required files into the `/build` directory.

To serve those, run `gulp serve-production` instead of `gulp serve`

### Package builds

To build what the package bot generates, run `gulp package`.
This will

* not process the `index.html` to include correct hosts for the current
  environment
* not replace the sourceMap url in the `application.min.js` to point to
  the correct app host

The main observable difference in development will be that a `package`
run will not include `CF_ENV` and `CF_CONFIG` in the `index.html`,
whereas a `build` run will.

This task is only really intended to be used in the package-bot.

### Client library development

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

## Environments

The Gulpfile uses then value of the `UI_ENV` environment variable to
populate the `env.environment` value in the client.

If no `UI_ENV` is specified, `development` is assumed.

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

