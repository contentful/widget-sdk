Routing
=======

To realize front-end routing we use [Angular UI Router][https://github.com/angular-ui/ui-router].

`states/config` Angular service is a wrapper for UI Router which can be used to
register states using our internal, slightly modified format.

**IMPORTANT**

We want to sooner or later move away from the current solution. We should make
sure we don't tie ourselves too much to UI Router. At the same time any cleanup
or decoupling will make future migration easier.


## States tree

`src/javascripts/states/states.es6.js` serves as a root of our states tree.

It exports a single root state as a plain JS object. Each state can define
`children` property which is a list of immediate child states what combined
forms the tree.

The following built-in UI Router configuration options for a state are
allowed:

- `url`
- `abstract`
- `resolve`
- `onEnter`

The following properties are processed:

- `name` - it is only the name of the state; parent state name will be
  prepended automatically
- `template` and `controller` will be automatically used in the `content@`
  view (as in `<ui-view />` directive). It basically means it'll be used
  for rendering everything but the top nav bar.
- `navTemplate` will be used as a template for the top nav bar.
- `redirectTo` - makes the state redirect to some other state.
- `children` as described above.

## Using React components directly

You can use `component` and `mapInjectedToProps` configuration options
to use React components directly:

```js
{
  name: 'test',
  url: '/test',
  component: MyNiceComponent,
  resolve: {
    something: Promise.resolve(true),
    testing: ['something', 'spaceContext', (something, spaceContext) => { /* ... */ }]
  },
  mapInjectedToProps: ['testing', 'spaceContext', (testing, spaceContext) => {
    return {
      testing,
      cmaClient: spaceContext.cma
    };
  }]
}
```

Services used in `resolve` **do not** have to use `$q` for promises.
