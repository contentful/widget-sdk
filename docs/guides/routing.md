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

- `nav-bar` that holds the space, organization, or account navigation
- `content` that holds the actual content controlled by the state.

If you define a state the single view properties (`controller`, `controllerAs`,
`template`, `templateProvider`) are moved automatically to the `content@` view.
(This is implemented in the `states/config` module.) If you provide a value for
`views['content@']` this will be ignored.

The `template` value must be a string.
