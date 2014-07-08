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

## components/space_view/tab_view_controller.js

Controller for the app tab view.

Handles route changes, app state changes and loads the appropriate tabs
based on that, by interacting with the space context `tabList` instance.

Creates a `navigator` object on the scope that can be easily used by the
whole app to navigate to and/or create new tabs.


## components/space_view/space_view.hamlc

Main space template.

Includes the app view based on the `viewType` value. In effect, this is
the UI component that switches the main sections of the app, and also
defines the navigation for these main sections.
