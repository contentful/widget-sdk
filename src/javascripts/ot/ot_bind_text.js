'use strict';

angular.module('contentful').directive('otBindText', ['$injector', function($injector) {
  var $parse            = $injector.get('$parse');
  var ShareJS           = $injector.get('ShareJS');
  var defer             = $injector.get('defer');
  var isDiacriticalMark = $injector.get('isDiacriticalMark');

  return {
    restrict: 'A',
    require: ['^otSubdoc', 'ngModel'],
    priority: 10, //textarea / input[type=text] are 0
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

      // TODO remove last remaining use of otTextIdle

      scope.$watch('otSubdoc', function(){
        //console.log('otBindText subdoc changed, reattaching');
        if (needsDetach()) detach();
        if (needsAttach()) attach();
      });

      scope.$on('$destroy', detach);

      var originalRender = ngModelCtrl.$render;
      ngModelCtrl.$render = function () {
        //console.log('calling original render on scope %o, path %o', scope.$id, scope.otPath);
        originalRender();
        //console.log('render, needs attach?', needsAttach() ? 'true, attaching' : 'false');
        if (needsAttach()) return attach();
        //console.log('render, needs detach?', needsDetach() ? 'true, detaching' : 'false');
        if (needsDetach()) return detach();
      };

      ngModelCtrl.$parsers.push(function (viewValue) {
        //console.log('parsing', viewValue);
        return (
          viewValue === '' ||
          viewValue && typeof viewValue == 'string' && viewValue.length === 1 && isDiacriticalMark.fromChar(viewValue)
        ) ? null : viewValue;
      });

      ngModelCtrl.$formatters.push(function (modelValue) {
        //console.log('formatting', modelValue);
        return modelValue === undefined || modelValue === null ? '' : modelValue;
      });

      ngModelCtrl.$viewChangeListeners.push(function () {
        //console.log('viewChangeListener triggered with', ngModelCtrl.$viewValue);
        //console.log('viewChangeListener, needs attach?');
        if (needsAttach()) {
          attach(ngModelCtrl.$viewValue);
          //console.log('viewChangeListener attached');
        //} else if (console.log('viewChangeListender, needs detach?', needsDetach()), needsDetach()) {
        } else if (needsDetach()) {
          detach();
          //console.log('viewChangeListender detached, otChangeValue to null');
          // This needs to be deferred, because the OT change operation triggered by this keypress
          // is also deferred. If we would change the value to null now, some code in attach_textarea
          // would try to access null as a string in the next tick:
          defer(function () {
            //console.log('deferred otChangeValue to null running now');
            scope.otChangeValue(null);
          });
        }
      });

      function isAttached() {
        return !!unbindTextField;
      }

      function isString() {
        return _.isString(ngModelCtrl.$modelValue);
      }

      function needsAttach() {
        return !isAttached() && isString() && scope.otSubdoc;
      }

      function needsDetach() {
        return isAttached() && (!isString() || !scope.otSubdoc);
      }

      function attach(text) {
        if (scope.otSubdoc) {
          //console.log('attaching');
          makeAndAttach(scope.otSubdoc, text);
        }
      }

      function detach() {
        if (unbindTextField) {
          //console.log('detaching');
          unbindTextField();
          unbindTextField = null;
        }
      }

      function makeAndAttach(subdoc, text){
        text = text === undefined ? '' : text;
        var loggingData = {
          subdoc: subdoc,
          text: text,
          otDoc: scope.otDoc
        };
        ShareJS.mkpath({
          doc: scope.otDoc,
          path: subdoc.path,
          types: subdoc.types,
          value: text
        }, function(err) {
          if (err){
            scope.$apply(function(){
              var error = new Error('makeAndAttach mkpath failed');
              error.metaData = {
                data: loggingData,
                error: err
              };
              throw error;
            });
          }
        });
        unbindTextField = subdoc.attach_textarea(elm[0]);
      }

      //console.log('linking done', scope.$id, scope.otPath);
    }

  };
}]);
