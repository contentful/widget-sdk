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

### Production builds

To build the production version of the assets, run `gulp build`.
That'll put all required files into the `/build` directory.

To serve those, run `gulp serve-production` instead of `gulp serve`

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

## Styleguide

In order to generate the styleguide run:
```
./bin/styleguide.sh
```

This will generate the styleguide in `app/assets/stylesheets/styleguide`

If you'd like to publish the newly generated and updated styleguide:
```
./bin/styleguide.sh push
```
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

