'use strict';

// Opens new scope, binds 'path' to whatever the argument to ot-edit-path
// evaluates to in the current scope and injects the otEditPathHelper into the scope
angular.module('contentful/directives').directive('otEditPath', function(ShareJS) {

  return {
    restrict: 'AC',
    require: '^otDocFor',
    scope: true,
    link: function(scope, elem, attr) {
      scope.$watch(function(scope) {
        var pathString = attr['otEditPath'];
        return scope.$eval(pathString);
      }, function(path, old, scope) {
        scope.path = path;
      }, true);
    },
    controller: function OtEditPathCtrl($scope) {
      // TODO move removeListener as a hidden var here
      $scope.editable = !!$scope.doc;

      $scope.$watch('doc', function updateDoc(doc, old ,scope) {
        if (old && old !== doc) {
          old.removeListener(scope.docListener);
          scope.docListener = null;
        }

        if (doc){
          scope.docListener = doc.at([]).on('child op', function(path) {
            var pathPrefixMatches = angular.equals(path.slice(0,scope.path.length), scope.path);
            if (pathPrefixMatches) {
              scope.$apply(function(scope) {
                scope.$broadcast('valueChanged', doc.getAt(scope.path));
              });
            }
          });
          var value = ShareJS.peek(scope.doc, scope.path);
          scope.$broadcast('valueChanged', value);
          scope.editable = true;
        } else {
          scope.$broadcast('valueChanged', scope.value);
          scope.editable = false;
        }
      });

      $scope.$on('$destroy', function (event) {
        var scope = event.currentScope;
        if (scope.doc && scope.docListener) {
          scope.doc.removeListener(scope.docListener);
          scope.docListener = null;
        }
      });

      $scope.changeValue = function(value, callback) {
        //console.log('changing value %o -> %o in %o, %o', $scope.doc.getAt($scope.path), value, $scope.path, $scope.doc);
        if ($scope.doc) {
          try {
            callback = callback || function(err){if (!err) $scope.$apply();};
            $scope.doc.setAt($scope.path, value, callback);
            //console.log('changin value returned %o %o in doc %o version %o', err, data, $scope.doc, $scope.doc.version);
          } catch(e) {
            ShareJS.mkpath($scope.doc, $scope.path, value, callback);
          }
        } else {
          console.error('No doc to push %o to', value);
        }
      };

    }
  };
});
