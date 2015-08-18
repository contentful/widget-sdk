'use strict';

/**
 * Bind a text input to an ot string
 *
 * <input type="text" ng-model="fieldData.value" ot-bind-text>
 *
 * Needs an ngModel. Everything else is handled automatically.
 */
angular.module('contentful').directive('otBindText', ['$injector', function($injector) {
  var $parse            = $injector.get('$parse');
  var ShareJS           = $injector.get('ShareJS');
  var defer             = $injector.get('defer');
  var logger            = $injector.get('logger');

  var ReloadNotification = $injector.get('ReloadNotification');

  var DIACRITICAL_CHAR_CODES = [
    94,  //^
    96,  //`
    126, //~
    168, //¨
    180  //´
  ];

  return {
    restrict: 'A',
    require: ['^otPath', 'ngModel'],
    priority: 10, //textarea / input[type=text] are 0
    link: function(scope, elm, attrs, controllers) {
      var ngModelCtrl = controllers[1];
      var unbindTextField;
      var ngModelGet = $parse(attrs.ngModel),
          ngModelSet = ngModelGet.assign;

      scope.$on('otValueChanged', function (event, path, val) {
        if (path === event.currentScope.otPath) ngModelSet(event.currentScope, val);
      });

      scope.$watch('otSubDoc.doc', function(){
        if (needsDetach()) detach();
        if (needsAttach()) attach();
      });

      scope.$on('$destroy', detach);

      ngModelCtrl.$parsers.push(parseToNull);
      ngModelCtrl.$formatters.push(formatToEmptyString);
      ngModelCtrl.$viewChangeListeners.push(attachOrDetach);

      var originalRender = ngModelCtrl.$render;
      // See the attachOrDetach method for an explanation of this method
      ngModelCtrl.$render = function () {
        originalRender();
        if (needsAttach()) return attach();
        if (needsDetach()) return detach();
      };

      /**
       * Parses the input to null if
       * - value is empty: because empty values in our entities should be
       * represented as null
       * - Value is a diacritic and the first character in a value:
       * because diacritics are used in conjunction with characters and we don't
       * want to change from null if the actual character/diacritic combination
       * hasn't been generated yet
      */
      function parseToNull(viewValue) {
        return (
          viewValue === '' ||
          viewValue && typeof viewValue == 'string' && viewValue.length === 1 && isDiacriticalMark(viewValue)
        ) ? null : viewValue;
      }

      function isDiacriticalMark(val) {
        return val && DIACRITICAL_CHAR_CODES.indexOf(val.charCodeAt(0)) > -1;
      }

      /**
       * Because the empty strings need to be stored in our entities as null, when
       * we retrieve a value for usage we want to convert it to an empty string
       * before giving it to our input.
      */
      function formatToEmptyString(modelValue) {
        return modelValue === undefined || modelValue === null ? '' : modelValue;
      }

      /**
       * In order to avoid weird issues with attach_textarea we want to detach
       * the textarea from ShareJS if the value changes to null.
       * The same procedure is performed in $render.
      */
      function attachOrDetach() {
        if (needsAttach()) {
          attach(ngModelCtrl.$viewValue);
        } else if (needsDetach()) {
          detach();
          // This needs to be deferred, because the OT change operation triggered by this keypress
          // is also deferred. If we would change the value to null now, some code in attach_textarea
          // would try to access null as a string in the next tick:
          defer(function () {
            scope.otSubDoc.changeValue(null);
          });
        }
      }

      function isAttached() {
        return !!unbindTextField;
      }

      function needsAttach() {
        return !isAttached() && isString() && scope.otSubDoc.doc;
      }

      function needsDetach() {
        return isAttached() && (!isString() || !scope.otSubDoc.doc);
      }

      function isString() {
        return _.isString(ngModelCtrl.$modelValue);
      }

      function attach(text) {
        if (scope.otSubDoc.doc) {
          makeAndAttach(scope.otSubDoc.doc, text);
        }
      }

      function detach() {
        if (unbindTextField) {
          unbindTextField();
          unbindTextField = null;
        }
      }

      function makeAndAttach(subdoc, text){
        text = text === undefined ? '' : text;
        ShareJS.mkpathAndSetValue({
          doc: scope.otDoc.doc,
          path: subdoc.path,
          types: subdoc.types,
          value: text
        }, handleMkPathErrors);
        unbindTextField = subdoc.attach_textarea(elm[0]);
      }

      function handleMkPathErrors(err) {
        if (err){
          scope.$apply(function(){
            logger.logError('makeAndAttach mkpathAndSetValue failed', {
              data: err,
            });
            ReloadNotification.trigger();
          });
        }
      }

    }

  };
}]);
