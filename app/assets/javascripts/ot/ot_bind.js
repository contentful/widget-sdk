'use strict';

var otModule = angular.module('contentful');

otModule.directive('otBindText', function(ShareJS, $sniffer, $parse) {
  return {
    restrict: 'A',
    require: ['^otSubdoc', 'ngModel'],
    link: function(scope, elm, attrs, controllers) {
      var ngModelCtrl = controllers[1];
      var unbindTextField;
      var ngModelGet = $parse(attrs.ngModel),
          ngModelSet = ngModelGet.assign;

      //scope.$on('otRemoteOp', function (event, op) {
        //console.log('remoteop', op);
      //});

      scope.$on('otValueChanged', function (event, path, val) {
        //console.log('value changed, updating model', path, val);
        if (path === event.currentScope.otPath) ngModelSet(event.currentScope, val);
      });

      function needsAttach() {
        return _.isString(ngModelCtrl.$modelValue) && !unbindTextField;
      }

      function needsDetach() {
        return !_.isString(ngModelCtrl.$modelValue) && unbindTextField;
      }

      function attach() {
        if (scope.otSubdoc) {
          //console.log('attaching');
          makeAndAttach(scope.otSubdoc);
        }
      }

      function detach() {
        if (unbindTextField) {
          //console.log('detaching');
          unbindTextField();
          unbindTextField = null;
        }
      }

      var originalRender = ngModelCtrl.$render;
      ngModelCtrl.$render = function () {
        //console.log('original render', scope.$id, scope.otPath);
        originalRender();
        //console.log('render, needs attach?');
        if (needsAttach()) return attach();
        //console.log('render, needs detach?');
        if (needsDetach()) return detach();
      };

      ngModelCtrl.$parsers.push(function (viewValue) {
        //console.log('parsing', viewValue);
        return viewValue === '' ? null : viewValue;
      });

      ngModelCtrl.$formatters.push(function (modelValue) {
        //console.log('formatting', modelValue);
        return modelValue === undefined || modelValue === null ? '' : modelValue;
      });

      ngModelCtrl.$viewChangeListeners.push(function () {
        //var value = ngModelCtrl.$viewValue;
        //console.log('viewChangeListender', ngModelCtrl.$viewValue);
        //console.log('viewChangeListender,needs attach?');
        if (needsAttach()) {
          attach();
          //console.log('viewChangeListender, resetting val to', ngModelCtrl.$viewValue);
          elm.val(ngModelCtrl.$viewValue);
          //console.log('viewChangeListender, trigger change');
          elm.trigger('change');
        } else if (/*console.log('viewChangeListender, needs detach?'), */needsDetach()) {
          detach();
          //console.log('viewChangeListender, otChangeValue to null');
          // This needs to be deferred, because the OT change operation triggered by this keypress
          // is also deferred. If we would change the value to null now, some code in attach_textarea
          // would try to access null as a string in the next tick:
          _.defer(function () {
            scope.otChangeValue(null);
          });
        }
      });

      // TODO remove last remaining use of otTextIdle

      scope.$watch('otSubdoc', function(otSubdoc){
        if (!otSubdoc) detach();
        else if (needsAttach()) attach();
      });

      scope.$on('$destroy', detach);

      function makeAndAttach(subdoc){
        if (!_.isString(ShareJS.peek(subdoc.doc, subdoc.path))) {
          ShareJS.mkpath(scope.otDoc, subdoc.path, '', function() {
            //console.log('attaching textarea %o to %o after mkPath', elm[0], subdoc.path, err);
          });
        }
        unbindTextField = subdoc.attach_textarea(elm[0]);
      }
      //console.log('linking done', scope.$id, scope.otPath);
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
