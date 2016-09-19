Routing
=======

To realize front-end routing we use [ui-router][] with small tools built on top
of it.

[ui-router]: https://github.com/angular-ui/ui-router


## States tree

Files in `src/javascripts/states` directory export plain JS objects describing
states of the app. The format of state definition is identical with ui-router's
defaults, but we also allow an extra `children` property that can be an array
of child state definitions. The `states/config` service can transform a tree
created this way into `$stateProvider.state` calls, with properly configured
names and URLs.


## Default view

We don't rely heavily on `<ui-view />` directive. The `cf_app_container.jade`
file defines two views:

- `nav-bar` that holds the navigation bar when user is in the space context
- `content` that can be addressed absolutely (`content@`) to render a template
  of a current state

Because almost all states in the app use the `content@` view, state definition
properties that constitute a single view (`controller`, `controllerAs`,
`template`, `templateProvider`) are moved automatically to the `content@` view.

If some other view should be used, `views` property of the definition allows
to override the default view.

Please keep in mind that if you'll provide `views['content@']` view then
top-level properties will be ignored.
