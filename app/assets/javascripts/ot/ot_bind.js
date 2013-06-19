'use strict';

var otModule = angular.module('contentful');

otModule.directive('otBindText', function(ShareJS, $sniffer) {
  return {
    restrict: 'A',
    priority: 400,
    require: '^otSubdoc',
    link: function(scope, elm) {
      var unbindTextField;

      scope.$watch('otSubdoc', function(otSubdoc, old, scope){
        if (!otSubdoc && unbindTextField) {
          unbindTextField();
          unbindTextField = null;
        }

        if (otSubdoc) {
          var value = ShareJS.peek(otSubdoc.doc, otSubdoc.path);
          var detachTextField = attachTextField(otSubdoc, elm[0]);
          if (value != ShareJS.peek(otSubdoc.doc, otSubdoc.path)) _.defer(function () {
            elm.trigger($sniffer.hasEvent('input') ? 'input' : 'change');
          });

          var changeHandler = _.debounce(function () {
            //console.log('emitting textIdle');
            scope.$apply(function (scope) {
              scope.$emit('otTextIdle', otSubdoc.path, otSubdoc.get());
            });
          }, 300);

          // TODO: This here does not catch change/input events
          // see https://github.com/angular/angular.js/blob/master/src/ng/directive/input.js#L411
          elm.on('keyup', changeHandler);

          scope.unbindTextField = function () {
            detachTextField();
            detachTextField = null;
            elm.off('keyup', changeHandler);
            changeHandler = null;
          };
        }
      });

      scope.$on('$destroy', function () {
        if (unbindTextField) {
          unbindTextField();
          unbindTextField = null;
        }
      });

      function attachTextField(subdoc, element){
        var detachTextField;
        if (_.isString(ShareJS.peek(subdoc.doc, subdoc.path))) {
          //console.log('attaching textarea %o to %o', elm[0], subdoc.path);
          detachTextField = subdoc.attach_textarea(element);
        } else {
          ShareJS.mkpath(scope.otDoc, subdoc.path, '', function() {
            //console.log('attaching textarea %o to %o after mkPath', elm[0], subdoc.path, err);
            detachTextField = subdoc.attach_textarea(element);
          });
        }
        return detachTextField;
      }
    }

  };
});

otModule.directive('otBindModel', function($parse) {
  return {
    restrict: 'A',
    require: ['ngModel', '^otPath'],
    link: function(scope, elm, attr, controllers) {
      var ngModelCtrl = controllers[0];
      var ngModelGet = $parse(attr['ngModel']),
          ngModelSet = ngModelGet.assign;
      ngModelCtrl.$viewChangeListeners.push(function(){
        scope.otChangeValue(ngModelCtrl.$modelValue);
      });
      scope.$on('otValueChanged', function(event, path, val) {
        if (path === event.currentScope.otPath) ngModelSet(event.currentScope, val);
      });
    }
  };
});

// Untested, do not use because we don't need it internally, see notes below for intended use scenario
otModule.directive('otBindValue', function($parse) {
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
});
