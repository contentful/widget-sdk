# Routing system

This file contains an overview of the routing system in user_interface,
its components and how it works.

## services/routing.js

Main routing service.

Defines routes and sets the `viewType` when a given route is visited.

Contains methods for:
* getting route, path and current space information.
* redirecting to a given space, organization or tab object.
* generating a route path based on a given `viewType`

## classes/tab_list.js

Holds list of open tabs. Handles creating, closing and activating tabs.

## classes/tab_options_generator.js

Generates options to create new tabs based on parameters of currently
viewed objects (entries, assets, etc).

## components/space_view/tab_view_controller.js

Controller for the app tab view.

Handles route changes, app state changes and loads the appropriate tabs
based on that, by interacting with the space context `tabList` instance.

Creates a `navigator` object on the scope that can be easily used by the
whole app to navigate to and/or create new tabs, generating options from
the `tab_options_generator`.


## components/space_view/space_view.hamlc

Main space template.

Includes the app view based on the `viewType` value. In effect, this is
the UI component that switches the main sections of the app, and also
defines the navigation for these main sections.

# Adding a new tab

* Create a route in the routing service, that sets a `viewType`, and also add it to the `makeLocation` method so a path can be retrieved, given the `viewType`
* Create a Tab Options object in the `TabOptionsGenerator`, which specifies the `viewType` for the tab and some other options. If the tab shouldn't show up in the tab list (top level sections) it should be `hidden`
 * If it's a tab with no parameters (as in, a list, not a specific view that needs to be initialized with an item) and we want to track it via analytics in the Tab View Controller, it should be added to `forViewType` in the `TabOptionsGenerator`
* Add a container for the tab in `space_view.hamlc` under the `.tab-content` element. The identifier and class name should be the same as the viewType specified in the previous step.
* Add it in the `navigator` object under `TabViewController`, and in the `openRoute` method. If it's a top level tab that should be tracked via analytics, also add it in `goToView`

Check this [commit](https://github.com/contentful/user_interface/commit/274852f8cba6106f8c14f1266900d2a6c1842fd8) for an example.
