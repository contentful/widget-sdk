'use strict';

angular.module('contentful').controller('ContentTypeFieldListCtrl', function($scope, analytics, validation, $q, random, sentry) {

  $scope.$watchCollection('contentType.data.fields', function (fields, old, scope) {
    if (hasUIIDs(fields)) {
      scope.fieldList = fields;
    } else {
      scope.fieldList = _.map(fields, function (field) {
        if (field.uiid) {
          return field;
        } else {
          field = Object.create(field);
          field.uiid = random.id();
          return field;
        }
      });
    }
  });

  $scope.$watch('otDoc', function (otDoc, old, scope) {
    var otBecameActive = otDoc && !old;
    if (otBecameActive && !hasUIIDs(scope.contentType.data.fields)) {
      prepareUIIDs(scope.contentType);
    }
  });

  function hasUIIDs(fields) {
    return _.all(fields, 'uiid');
  }

  function prepareUIIDs(contentType) {
    return $scope.waitFor('otDoc').then(function (otDoc) {
      return $q.all(_(contentType.data.fields).reject('uiid').map(function (field, index) {
        var d = $q.defer();
        otDoc.setAt(['fields', index, 'uiid'], random.id(), function (err, res) {
          if (err) d.reject(err);
          else d.resolve(res);
        });
        return d.promise;
      }).value());
    }).finally(function () {
      $scope.otUpdateEntity();
    });
  }

  var openFieldUIID;
  $scope.toggleField = function (field) {
    if(!field) {
      sentry.captureError('field is not defined', {
        data: {
          fields: $scope.contentType.data.fields
        }
      });
    }
    if (openFieldUIID == field.uiid){
      openFieldUIID = null;
    } else {
      openFieldUIID = field.uiid;
    }
  };

  $scope.fieldClicked = function (field) {
    if (!$scope.isFieldOpen(field)) $scope.openField(field);
  };

  $scope.openField = function (field) {
    openFieldUIID = field.uiid;
  };

  $scope.closeAllFields = function () {
    openFieldUIID = null;
  };

  $scope.isFieldOpen = function (field) {
    return openFieldUIID == field.uiid;
  };

  $scope.fieldTypeParams = function (f) {
    var params = [f.type, f.linkType];
    if (f.items) params.push(f.items.type, f.items.linkType);
    return params;
  };

  $scope.fieldIsPublished = function (field) {
    if (!$scope.publishedContentType || !$scope.publishedContentType.data) return false;

    if (hasUIIDs($scope.publishedContentType.data.fields)) {
      // should be the default case
      return _.contains($scope.publishedUIIDs, field.uiid);
    } else {
      // Fallback for published content types that don't yet have uiids
      var idIsPublished = _.contains($scope.publishedIds, field.id);
      return idIsPublished && (idIsUnique(field) || (typeMatchesPublished(field) && typeIsUnique(field)));
    }
  };

  function idIsUnique(field) {
    return _.countBy($scope.fieldList, 'id')[field.id] < 2;
  }

  function typeMatchesPublished(field) {
    var publishedField = _.find($scope.publishedContentType.data.fields, {id: field.id});
    return angular.equals($scope.fieldTypeParams(field), $scope.fieldTypeParams(publishedField));
  }

  function typeIsUnique(field) {
    var fieldType = $scope.fieldTypeParams(field);
    return _.every($scope.fieldList, function isDifferent(other) {
      if (field === other) return true; // always equal to self but that doesn't count so treat it as different
      return other.id !== field.id || !angular.equals(fieldType, $scope.fieldTypeParams(other));
    });
  }

  $scope.pickNewDisplayField = function () {
    var current = _.find($scope.contentType.data.fields, {id: $scope.contentType.data.displayField});
    var currentIsFine = current && displayEnabled(current);
    if (!currentIsFine) {
      var firstEnabled = _.find($scope.contentType.data.fields, displayEnabled);
      if (firstEnabled) $scope.setDisplayField(firstEnabled);
      else $scope.removeDisplayField();
    }

    function displayEnabled(field) {
      return field.type === 'Symbol' || field.type === 'Text';
    }
  };

  $scope.setDisplayField = function (field) {
    $scope.otDoc.at(['displayField']).set(field.id, function (err) {
      if (!err) $scope.$apply(function (scope) {
        scope.contentType.data.displayField = field.id;
      });
    });
  };

  $scope.removeDisplayField = function () {
    $scope.otDoc.at(['displayField']).set(null, function (err) {
      if (!err) $scope.$apply(function (scope) {
        scope.contentType.data.displayField = null;
      });
    });
  };

  $scope.$watch('validationResult.errors', function activateErroredDisabledFields(errors, old, scope) {
    _.each(errors, function (error) {
      if (error.path[0] === 'fields' && angular.isDefined(error.path[1])) {
        var field = scope.contentType.data.fields[error.path[1]];
        if (field.disabled) scope.preferences.showDisabledFields = true;
      }
    });
  });

  $scope.$on('fieldAdded', function (event, index) {
    var scope = event.currentScope;
    scope.openField(scope.contentType.data.fields[index]);
  });
});
