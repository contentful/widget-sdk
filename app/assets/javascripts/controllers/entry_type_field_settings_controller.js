angular.module('contentful/controllers').controller('EntryTypeFieldSettingsCtrl', function ($scope, getFieldTypeName) {
  'use strict';

  $scope.getFieldTypeName = getFieldTypeName;

  $scope.$watch('publishedIds', function(ids, old, scope) {
    if (ids) {
      scope.published = _.contains(ids, scope.field.id);
    }
  });

  $scope.$watch('doc', function(doc, old, scope) {
    if (old && old !== doc) {
      scope.field = null;
      old.removeListener(scope.childListener);
      scope.childListener = null;
    }
    if (doc) {
      scope.field = doc.snapshot.fields[scope.index];
      scope.childListener = doc.at([]).on('child op', function(path, op) {
        if (path[0] === 'fields' && path[1] === scope.index) {
          //console.log('child op applying at', scope.index, path, op);
          if (path[2] === 'disabled' || path[2] == 'type') {
            scope.$apply(function(scope) {
              scope.field = doc.snapshot.fields[scope.index];
            });
          } else if (path.length == 2 && op.ld) {
            scope.$destroy();
          }
        }
      });
    }
  });

  $scope.$on('otRemoteOp', function (event, op) {
    console.log('fieldListRowController received op', op, event);
  });

  $scope.enable = function() {
    this.doc.at(['fields', this.index, 'disabled']).set(false, function(err) {
      if (!err) $scope.$apply(function(scope) {
        scope.field.disabled = false;
      });
    });
  };
  $scope.disable = function() {
    this.doc.at(['fields', this.index, 'disabled']).set(true, function(err) {
      if (!err) $scope.$apply(function(scope) {
        scope.field.disabled = true;
      });
    });
  };

  $scope.delete = function() {
    this.doc.at(['fields', this.index]).remove();
  };

});
