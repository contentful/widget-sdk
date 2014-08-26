# Coding Guidelines

## AngularJS

### Filenames and structure

Put one angular artifact (controller, directive, template) per file.

Group files by directive:

- foo_bar_directive.js
- foo_bar_controller.s
- foo_bar.hamlc

File names are always lowercase with underscores.

Directives *always* go in files named `xxx_directive.js` even when they
don't have controllers or templates.

hamlc filenames have to be unique across directories, because their
basename is used to store them in the global `JST` object.

### Modules & Injection

In every file, get a reference to the contentful module and declare one
artifact like this:

```
'use strict';
angular.module('contentful').factory('FooService', function(){

});
```

Always use Angulars array pattern to supply injector hints.
Only inject:
- locals (like `$scope`, `$attrs` for controllers)
- `$injector` if you want to use any other services

Nothing else!

Then in the head of the function, use `$injector.get('serviceName')` to
require additional services:

```
angular.module('contentful').controller('FooController', ['$scope', '$injector', function FooController($scope, $injector){
  var editingInterfaces = $injector.get('editingInterfaces');
  var logger            = $injector.get('logger');
}]);
```

Here, `$scope` is a local injection, one that does not come from the
provider but is supplied at runtime.
Since `$scope` is not a service but a local, the `$injector.get` method
won't find it. That's why we have to put it into the Argument list for
the function. The same logic applies to other locals as well.

The list of `$injector.get()` calls should be aligned at the `=` and
sorted alphabetically (use vims `:sort` function):

Bad:
```
angular.module('contentful').controller('FieldSettingsEditorCtrl', ['$scope', '$injector', function ($scope, $injector) {
  var $controller = $injector.get('$controller');
  var getFieldTypeName = $injector.get('getFieldTypeName');
  var analytics = $injector.get('analytics');
  var validation = $injector.get('validation');
  var assert = $injector.get('assert');
  var notification = $injector.get('notification');
  var stringUtils = $injector.get('stringUtils');
  var logger = $injector.get('logger');
  var defer = $injector.get('defer');
```

Good:
```
angular.module('contentful').controller('FieldSettingsEditorCtrl', ['$scope', '$injector', function ($scope, $injector) {
  var $controller      = $injector.get('$controller');
  var analytics        = $injector.get('analytics');
  var assert           = $injector.get('assert');
  var defer            = $injector.get('defer');
  var getFieldTypeName = $injector.get('getFieldTypeName');
  var notification     = $injector.get('notification');
  var logger           = $injector.get('logger');
  var stringUtils      = $injector.get('stringUtils');
  var validation       = $injector.get('validation');
```

### Controllers and Scope

In general **always** prefer controllers over link functions.
The only excuse for using link functions is:
- requiring controllers from other directives
- interacting with `element`

#### Exposing controllers
Use the `controllerAs` option for directives to expose controllers on
the Scope.

Controllers that become too large can be split up by extracting parts of
their functionality into separate controllers. Since directives and the
`ng-controller` attribute can only instantiate a single controller, use
the `$controller` service to instantiate the children from the original
controller:

```
'use strict';

angular.module('contentful').controller('EntryListCtrl', ['$scope', '$injector', function EntryListCtrl($scope, $injector) {
  var $controller        = $injector.get('$controller');

  // This should be the default case
  $scope.displayedFieldsController = $controller('DisplayedFieldsController', {$scope: $scope});

  // If the controller does not expose an external interface but only
  // sets up stuff on the scope
  $controller('EntryListViewsController', {$scope: $scope});

  // You might want to keep an internal reference
  var entryListViewsController = $controller('EntryListViewsController', {$scope: $scope});

  // You _can_ do something like this (expose it under a different name)
  // but only when you have a really really compelling argument for it
  $scope.fieldsController = $controller('DisplayedFieldsController', {$scope: $scope});
```

#### Structuring controllers

Structure controllers like this:

```
'use strict';
angular.module('contentful').controller('FormWidgetsController', ['$scope', '$injector', function FormWidgetsController($scope, $injector){
  // 1. Self-reference
  // You might need this to reference the controllers in functions
  // executed out of context:
  var controller = this;

  // 2. requirements
  var editingInterfaces = $injector.get('editingInterfaces');
  var logger            = $injector.get('logger');

  // 3. Do scope stuff
  // It doesn't really matter in which order you perform a b or c,
  // but all the scope stuff should
  //   1) stay together
  //   2) each should be a single line
  // More complicated functions should be extracted

  // 3a. Set up watchers on the scope. 
  $scope.$watch(function (scope) {
    return _.pluck(scope.spaceContext.activeLocales, 'code');
  }, updateWidgets, true);
  $scope.$watch('spaceContext.space.getDefaultLocale()', updateWidgets);
  $scope.$watch('preferences.showDisabledFields',        updateWidgets);
  $scope.$watch('errorPaths',                            updateWidgets);

  // 3b. Expose methods or data on the scope

  // 3c. Listen to events on the scope 

  // 4. Expose methods and properties on the controller instance
  this.updateWidgets = updateWidgets;
  this.updateWidgetsFromInterface = updateWidgetsFromInterface;

  // 5. Clean up
  $scope.$on('$destroy', function(){
    // Do whatever cleanup might be necessary
    controller = null; // MEMLEAK FIX
    $scope     = null; // MEMLEAK FIX
  });

  // 6. All the actual implementations go here. 
  // Everything that didn't fit into one line in the parts above should be
  // extracted into a function here
  function updateWidgets() {
    …
  }

  function updateWidgetsFromInterface(interf) {
    …
  }
}]);
```

This helps to expose all relevant interface in one glance.

For child controllers (see previous section) the place to put them
depends on how they're implemented.
They might require some stuff from the Scope or create stuff on the
scope and is then used by something else.
That's why there is no single guideline, put them wherever they need to be.

#### Controller size and interfaces

Keep controllers small.

It's easy to split out functionalilty by using the `$controller` service
as illustrated above. That helps keep them better testable.

Using the structure outlined in the previous section helps to keep the
interface to a controller slim and easy to test.

What remains is the question: where yo put data and functions:

The basic rules should be:
- Put as little on the scope as possible.
- Expose main model data structures and helper state
- Functionality that is assigned to handlers (`ng-click` etc.) should be
  exposed as methods on controllers
- Helper-Methods that return some object or expect some state or
  encapsulate complex expressions should alse be exposed on the
  controller.

These rules can be flexible where necessary. The main goal is to avoid
cluttering the scope.

Ideally, a controller is just a slim interface between the scope and
services. The main advantage of a controller is that there can be
multiple instances, each carrying different state. While it makes sense
for example to store the current Space in a service and exposing access
through a controller, there can be multiple Entry editors with multiple
controllers, each referencing a different Entry.

### Directives

#### Restrictions

Use only two kinds of restrictions, Attribute directives or Element
directives.

Directives should generally be prefixed with `cf`, unless they apply to
some pre-existing attribute.

Do not use the compatibility versions for referencing directives.
No `x-cf-foo` or `data-cf-foo`, simply `cf-foo` is sufficient.

#### Scope

Do not use isolate scopes.

#### Templates

Do not use inline templates.
Do not use templateUrl.

Use Haml-generated templates from the global JST object:

```
  template: JST['foo_bar'](),
```

Do not use the `replace` option. It's gonna be deprecated soon.

#### Controllers

Do not put controllers inline. Always put them in their own file and
reference them by their name. Even if they are small.

#### Link function

Use the following signature for the link function:

```
function link(scope, elem, attr) {}
```

Plus possible required controllers.

#### Cleanup

Clean up in the link function by unregistering event handlers etc:

```
scope.$on('$destroy', function(){
  // Uninstall event handlers on $window etc.
  scope = null; // MEMLEAK FIX
});
```

### Services

Don't reference `window`, `document`, `_.defer`, `_.debounce`,
`_.throttle`, `_.delay` anywhere in your angular code.

Use their matching services instead:

`$window`, `$document`, `defer`, `debounce`, `throttle`, `delay`.

## Javascript
