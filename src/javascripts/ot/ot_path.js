'use strict';

/**
 * @ngdoc directive
 * @name otPath
 * @scope.requires otDoc
 * @property otPath
 * @property otPathTypes
 *
 * @description
 * Scopes a part of an ot component to a path within the ot document
 * defined by the value of the ot-path attribute
 *
 * @usage[html]
 * <entity-editor ot-doc-for="entity">
 *   <part-editor ot-path="['fields', 'fieldId', 'locale']" ot-path-types="['String', 'String', 'String']">
*/

angular.module('contentful').directive('otPath', ['$injector', function($injector){
  var $q          = $injector.get('$q');
  var ShareJS     = $injector.get('ShareJS');
  var logger      = $injector.get('logger');

  return {
    restrict: 'AC',
    priority: 600,
    require: '^otDocFor',
    scope: true,

    link: function(scope, elem, attr) {
      scope.$watch(attr['otPath'], function(otPath, old, scope) {
        scope.otPath = otPath;
      }, true);

      scope.$watch(attr['otPathTypes'], function(otPathTypes, old, scope) {
        scope.otPathTypes = otPathTypes;
      }, true);

      scope.otPath = scope.$eval(attr['otPath']);
      scope.otPathTypes = scope.$eval(attr['otPathTypes']);
    },


  /**
   * @ngdoc type
   * @name otSubDoc
   * @property {otSubDoc} doc
   * @property {function()} getValue
   * Returns the value at the path in the document or undefined if the path is not found
   * @property {function()} changeStringValue
   * Update the string at the path to a new string.
   * Calculates the string difference using the algorithm from the ShareJS text binding to generate a insert and/or delete operation.
   * Returns a promise.
   *
   */

  /**
   * @ngdoc type
   * @name otPathController
   * @property otSubDoc
   *
   * @description
   * Broadcasts the following events:
   * - otValueChanged(path, newValue), broadcast: Whenever the value at this path changes
   */
    controller: ['$scope', function otPathController($scope) {
      $scope.otSubDoc = {
        doc: undefined,
        changeString: otChangeString,
        changeValue: otChangeValue,
        getValue: otGetValue
      };

      $scope.$watch('otDoc.doc', init);
      $scope.$watch('otPath', init, true);

      $scope.$on('otRemoteOp', remoteOpHandler);

      function init(val) {
        if ($scope.otPath && $scope.otDoc.doc) {
          updateSubDoc(val);
          $scope.$broadcast('otValueChanged', $scope.otPath, otGetValue());
        } else if($scope.otSubDoc.doc){
          $scope.otSubDoc.doc = undefined;
        }
      }

      function updateSubDoc(path) {
        var pathUpdated = path === $scope.otPath;
        if (pathUpdated && $scope.otSubDoc.doc) {
          // if the path has been changed, manipulate path in subdoc
          $scope.otSubDoc.doc.path =  angular.copy($scope.otPath);
        } else {
          // if the path has been replaced, replace subdoc
          $scope.otSubDoc.doc = $scope.otDoc.doc.at($scope.otPath);
        }
      }

      function remoteOpHandler(event, op) {
        var scope = event.currentScope;
        if (angular.equals(op.p, scope.otPath)) {
          scope.$broadcast('otValueChanged', scope.otPath, scope.otDoc.doc.getAt(op.p));
        }
      }

      /**
       * Replaces a string type field in the document  with a new string value by
       * computing the difference and generating a set of ShareJS operations to
       * manipulate the older string. This is useful in keeping the workflow natural
       * for editors in the scenario when a field is being hand-edited by one editor
       * but programmatically updated in the client of the other editor.
       * It also optimistically sends small operations whenever required instead of
       * sending the entire replacement string, which would be expensive with the kind
       * of incremental changes performed during typing.
       *
       * TL;DR - Simulates manual editing of the old string into the new string
       * for more natural collaboration.
       *
       * Additional note: this essentially replicates attach_textarea from ShareJS
       */
      function otChangeString(newValue) {
        if ($scope.otDoc.doc) {
          var oldValue = otGetValue();
          var cb = $q.callbackWithApply(),
              cbOp1 = $q.callbackWithApply(),
              cbOp2 = $q.callbackWithApply();

          if (!oldValue || !newValue) {
            ShareJS.mkpathAndSetValue({
              doc: $scope.otDoc.doc,
              path: $scope.otPath,
              types: $scope.otPathTypes,
              value: newValue || null
            }, cb);
            return cb.promise;
          } else if (oldValue === newValue) {
            return $q.when(cb.promise);
          } else {
            var commonStart = 0,
                commonEnd = 0,
                oldEnd = oldValue.length - 1,
                newEnd = newValue.length - 1;

            while (oldValue.charAt(commonStart) === newValue.charAt(commonStart)) {
              commonStart += 1;
            }
            while (oldValue.charAt(oldEnd - commonEnd) === newValue.charAt(newEnd - commonEnd) &&
                   commonStart + commonEnd < oldValue.length && commonStart + commonEnd < newValue.length) {
              commonEnd += 1;
            }

            if (oldValue.length !== commonStart + commonEnd) {
              $scope.otDoc.doc.deleteTextAt($scope.otPath, oldValue.length - commonStart - commonEnd, commonStart, cbOp1);
            }
            if (newValue.length !== commonStart + commonEnd) {
              $scope.otDoc.doc.insertAt($scope.otPath, commonStart, newValue.slice(commonStart, newValue.length - commonEnd), cbOp2);
            }
            return $q.all(cbOp1.promise, cbOp2.promise);
          }
        } else {
          return $q.reject('No otDoc to push to');
        }
      }

      /**
       * @ngdoc method
       * @name otSubDoc#changeValue
       * @description
       * Updates the value at the path to the new value.
       *
       * @param {any} value
       * @returns {Promise<void>}
       */
      function otChangeValue(value) {
        if (!$scope.otDoc.doc) {
          return $q.reject('No otDoc to push to');
        }

        // Ensure that no nulls are passed to `doc.setAt()`. See BUG#6696
        if(value === null) {
          var err = 'Do not call otChangeValue() with null. This causes ' +
            'ShareJS to keep null placeholders for keys which we want to avoid.';
          logger.logWarn(err);
          return $q.reject(err);
        }

        var cb = $q.callbackWithApply();
        try {
          $scope.otDoc.doc.setAt($scope.otPath, value, cb);
        } catch(e) {
          ShareJS.mkpathAndSetValue({
            doc: $scope.otDoc.doc,
            path: $scope.otPath,
            types: $scope.otPathTypes,
            value: value
          }, cb);
        } finally {
          return cb.promise;
        }
      }

      function otGetValue() {
        if ($scope.otDoc.doc) {
          return ShareJS.peek($scope.otDoc.doc, $scope.otPath);
        } else {
          return void(0);
        }
      }

    }]
  };
}]);
