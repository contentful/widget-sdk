# HTML Client App

## Preparations

Make sure you are using Node version specified in the [`.nvmrc`]('./.nvmrc')
file and the default NPM version that comes with that Node version.
Then run `./Installfile` to install all npm and bower dependencies

## Dependencies

We use Bower and NPM with at shrinkwrap file to manage our dependecies. If you
add a new dependency, prefer NPM over Bower.

Production dependencies in NPM are all those packages used on Travis to build
and test. Dev dependencies on the other hand are used to run tests locally,
build the documentation, etc.

To update a dependency, run
~~~js
npm install --save{-dev} my-dep@~1.2.3
npm shrinkwrap
./bin/clean-shrinkwrap
~~~
Make sure that `git diff npm-shrinkwrap.json` yield the correct result.

You can check for outdated dependencies with `npm outdated`.


## Running the dev server

To start developing, run `gulp clean` (optional), then `gulp all`.
That compiles all the files into the `public` directory.

Afterwards, run `gulp serve` to start the webserver on `localhost:3001`.
It'll serve the files from `public` every missing file will return
index.html.

The serve task also watches all javascript files, templates and
stylesheets and recompiles everything back into public as soon as
anything changes. If you want to disable watching, set `NO_WATCHING=1` in
your environment.

Not watched are the `user_interface` module and all the vendor stuff
(stylesheets and scripts). If you update one of those, run `gulp all`
again.

To show `stdout` of the commands `gulp` will run, use the `--verbose`
flag. For example `gulp icons -v`.


## Documentation

The repo comes with a self hosting API documentation and guides. To
view them run `gulp docs` and `gulp serve` and go to the
[`/docs`](http://app.joistio.com:8888/docs) folder of you development
server.

To continuously rebuild the documentation use `gulp docs/watch`.

## Testing

For more information on testing consult the generated guides on the
documentation or refer to [testing.md](docs/guides/testing.md)

## Styleguide

The styleguide is generated automatically when running `gulp serve` and
is served by gulp at `/styleguide`.

If you wish to generate it manually, you can run `gulp
generate-styleguide` and then check `public/styleguide`

If you wish to publish the styleguide, run `npm run publish-styleguide`, which
will generate the styleguide and publish it to the `gh-pages` branch which will
make it available as under <http://contentful.github.io/user_interface/>

Don't forget to provide an appropriate commit message outlining the changes.


## Builds and Deployment

We automatically deploy three branches to different hosts

* `preview` to `app.quirely.com`
* `staging` to `app.flinkly.com`
* `production` to `app.contentful.com`

Deployments are triggered by pushing commits to one of these branches.
The packages will be build on travis using `gulp build` and
`bin/travis-prepare-deploy`. To test a build locally run `gulp build
serve-production`. All files contained in `./build` are part of the package.

The built package still includes the dev host (i.e. `joistio.com`) in
its files. The are replaced on the servers by the `bin/process_hosts`
script.

If you wish to skip the tests on the `preview` environment for purposes
of showcasing unfinished work, you can add `[skip tests]` to your commit
message.


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
