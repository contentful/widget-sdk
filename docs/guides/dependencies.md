# Dependencies

We use NPM with the package-lock file to manage our dependencies.

## Adding a dependency

To ensure your installation is in a pristine state run

```js
nvm use
git checkout package.json package-lock.json
rm -rf node_modules
npm install
```

Now you can add your dependency

```js
npm install --save{-dev} my-dep@^1.2.3
```

Make sure that `git diff package-lock.json` yields an appropriate, small
result.

## Updating dependencies

Updating a dependency is the same as adding a dependency. The commit that updates
the dependencies should include links to the change logs of the updated
dependencies.

Outdated dependencies are updated regularly as part of the [frontend support
duty][fe-support]. You can check for outdated packages using `npm outdated`.

[fe-support]: https://contentful.atlassian.net/wiki/spaces/ENG/pages/36962377/Frontend+Chapter+Support+Rotations
