'use strict';

// Untested, DO NOT USE because we don't need it internally,
// see notes below for intended use scenario
angular.module('contentful').directive('otBindValue', ['$parse', function($parse) {
  return {
    restrict: 'A',
    require: '^otPath',
    scope: true,
    link: function(scope, elm, attr) {
      // Use this if you want to simply replace values in your ShareJS
      // document. Works by simply manipulating the `value` property
      // in the scope (as established by cfFieldEditor)
      //
      // This method should be only used as a last resort as a
      // shortcut if using a model binding is not possible. Main use
      // case is easier integration into sharejs for 3rd party widget
      // providers
      var getter = $parse(attr['otBindValue']),
          setter = getter.assign;
      //
      scope.$watch(attr['otBindValue'], function(val, old, scope) {
        scope.otChangeValue(val);
      }, true);

      scope.$on('otValueChanged', function(event, path, val) {
        if (path === event.currentScope.otPath) setter(event.currentScope, val);
      });

    }

  };
}]);

