'use strict';

/**
 * @ngdoc directive
 * @name otPath
 * @scope.requires otDoc
 * @property otPath
 *
 * @description
 * Scopes a part of an ot component to a path within the ot document
 * defined by the value of the ot-path attribute
 *
 * @usage[html]
 * <entity-editor ot-doc-for="entity">
 *   <part-editor ot-path="['fields', 'fieldId', 'locale']">
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
      // TODO no need for watchers. The attributes do not change
      scope.$watch(attr['otPath'], function(otPath, old, scope) {
        scope.otPath = otPath;
      }, true);

      scope.otPath = scope.$eval(attr['otPath']);
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
        var doc = $scope.otDoc.doc;
        var path = $scope.otPath;

        if (!doc) {
          // TODO should reject with an new Error instance
          return $q.reject('No otDoc to push to');
        }

        var oldValue = otGetValue();

        if (!oldValue || !newValue) {
          // TODO should this really be `null` an not an empty string?
          return ShareJS.mkpathAndSetValue(doc, path, newValue || null);
        } else if (oldValue === newValue) {
          return $q.when();
        } else {
          var commonStart = 0;
          var commonEnd = 0;
          var oldEnd = oldValue.length - 1;
          var newEnd = newValue.length - 1;

          while (oldValue.charAt(commonStart) === newValue.charAt(commonStart)) {
            commonStart += 1;
          }
          while (oldValue.charAt(oldEnd - commonEnd) === newValue.charAt(newEnd - commonEnd) &&
                 commonStart + commonEnd < oldValue.length && commonStart + commonEnd < newValue.length) {
            commonEnd += 1;
          }

          var ops = [];
          if (oldValue.length !== commonStart + commonEnd) {
            ops.push($q.denodeify(function (cb) {
              doc.deleteTextAt(path, oldValue.length - commonStart - commonEnd, commonStart, cb);
            }));
          }
          if (newValue.length !== commonStart + commonEnd) {
            ops.push($q.denodeify(function (cb) {
              doc.insertAt(path, commonStart, newValue.slice(commonStart, newValue.length - commonEnd), cb);
            }));
          }
          return $q.all(ops);
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
        var doc = $scope.otDoc.doc;
        var path = $scope.otPath;
        if (!doc) {
          return $q.reject('No otDoc to push to');
        }

        // Ensure that no nulls are passed to `doc.setAt()`. See BUG#6696
        if(value === null) {
          var err = 'Do not call otChangeValue() with null. This causes ' +
            'ShareJS to keep null placeholders for keys which we want to avoid.';
          logger.logWarn(err);
          return $q.reject(err);
        }

        // TODO we should replace this with `ShareJS.setDeep()`
        return $q.denodeify(function (cb) {
          doc.setAt(path, value, cb);
        }).catch(function () {
          return ShareJS.mkpathAndSetValue(doc, path, value);
        });
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
