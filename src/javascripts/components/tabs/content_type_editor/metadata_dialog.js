'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name contentTypeEditor/metadataDialog
 */
.factory('contentTypeEditor/metadataDialog', ['$injector', function ($injector) {
  var $rootScope = $injector.get('$rootScope');
  var modalDialog = $injector.get('modalDialog');

  return {
    openCreateDialog: openCreateDialog,
    openEditDialog:   openEditDialog,
  };

  /**
   * @ngdoc method
   * @name contentTypeEditor/metadataDialog#openCreateDialog
   */
  function openCreateDialog () {
    return openDialog({
      isNew: true,
      labels: {
        title: 'Create a new Content Type',
        save: 'Create'
      }
    });
  }

  /**
   * @ngdoc method
   * @name contentTypeEditor/metadataDialog#openEditDialog
   * @param {Client.ContentType} contentType
   */
  function openEditDialog (contentType) {
    var name = contentType.data.name;
    var desc = contentType.data.description;
    return openDialog({
      name: name,
      description: desc,
      isNew: false,
      labels: {
        title: 'Edit Content Type',
        save: 'Save'
      }
    });
  }

  function openDialog (params) {
    var scope = _.extend($rootScope.$new(true), {
      contentTypeMetadata: {
        name: params.name || '',
        description: params.description || '',
        id: ''
      },
      contentTypeIsNew: params.isNew
    });

    return modalDialog.open({
      title: params.labels.title,
      confirmLabel: params.labels.save,
      template: 'edit_content_type_metadata_dialog',
      noBackgroundClose: true,
      scope: scope,
      ignoreEnter: true
    }).promise.then(function () {
      return scope.contentTypeMetadata;
    });

  }

}])

/**
 * @ngdoc type
 * @name ContentTypeMetadataController
 *
 * @scope.requires {object} dialog
 * @scope.requires {object} contentTypeMetadata
 * @scope.requires {bool}   contentTypeIsNew
*/
.controller('ContentTypeMetadataController',
['$scope', '$injector', function ($scope, $injector) {
  var stringUtils = $injector.get('stringUtils');
  var spaceContext = $injector.get('spaceContext');

  var contentTypeIds = _.map(spaceContext.contentTypes, function (ct) {
     return ct.getId();
  });

  var ID_REGEXP = /^[a-zA-Z0-9-_.]*$/;

  $scope.$watch('newContentTypeForm.contentTypeId', function (ctrl) {
    if (!ctrl)
      return;

    ctrl.errorDetails = {
      unique: {message: 'A content type with this ID already exists'},
      format: {message: 'Please use only letters, numbers and underscores'},
      length: {message: 'Please shorten the text so it’s no longer than 64 characters'}
    };

    ctrl.$validators.unique = function (value) {
      return !_.contains(contentTypeIds, value);
    };

    ctrl.$validators.format = function (value) {
      return ID_REGEXP.test(value);
    };

    ctrl.$validators.length = function (value) {
      return value.length <= 64;
    };
  });

  $scope.$watch('contentTypeMetadata.name', function (name) {
    var idField = $scope.newContentTypeForm.contentTypeId;
    if (idField && !idField.$touched) {
      $scope.contentTypeMetadata.id = stringUtils.toIdentifier(name);
    }
  });

}]);
