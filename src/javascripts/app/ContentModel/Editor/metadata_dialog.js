'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name contentTypeEditor/metadataDialog
 */
.factory('contentTypeEditor/metadataDialog', ['require', function (require) {
  var $rootScope = require('$rootScope');
  var modalDialog = require('modalDialog');
  var Command = require('command');

  return {
    openCreateDialog: openCreateDialog,
    openEditDialog: openEditDialog,
    openDuplicateDialog: openDuplicateDialog
  };

  /**
   * @ngdoc method
   * @name contentTypeEditor/metadataDialog#openCreateDialog
   */
  function openCreateDialog (contentTypeIds) {
    return openDialog({
      isNew: true,
      contentTypeIds: contentTypeIds,
      labels: {
        title: 'Create new content type',
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
        title: 'Edit content type',
        save: 'Save'
      }
    });
  }

  function openDuplicateDialog (contentType, duplicate, contentTypeIds) {
    var scope = prepareScope({
      description: contentType.data.description,
      isNew: true,
      contentTypeIds: contentTypeIds,
      namePlaceholder: 'Duplicate of "' + contentType.data.name + '"'
    });

    scope.originalName = contentType.data.name;
    scope.duplicate = Command.create(function () {
      var d = scope.dialog;
      var form = d.formController;

      if (form.$valid) {
        return duplicate(scope.contentTypeMetadata)
        .then(_.bind(d.confirm, d), _.bind(d.cancel, d));
      } else {
        form.showErrors = true;
      }
    });

    return modalDialog.open({
      template: 'duplicate_content_type_dialog',
      noBackgroundClose: true,
      scope: scope,
      ignoreEnter: true,
      noNewScope: true
    }).promise;
  }

  function openDialog (params) {
    var scope = prepareScope(params);

    return modalDialog.open({
      title: params.labels.title,
      confirmLabel: params.labels.save,
      template: 'edit_content_type_metadata_dialog',
      noBackgroundClose: true,
      scope: scope,
      ignoreEnter: true,
      noNewScope: true
    }).promise.then(function () {
      return scope.contentTypeMetadata;
    });
  }

  function prepareScope (params) {
    return _.extend($rootScope.$new(true), {
      contentTypeMetadata: {
        name: params.name || '',
        description: params.description || '',
        id: ''
      },
      contentTypeIsNew: params.isNew,
      namePlaceholder: params.namePlaceholder || 'For example Product, Blog Post, Author',
      contentTypeIds: params.contentTypeIds
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
.controller('ContentTypeMetadataController', ['$scope', 'require', function ($scope, require) {
  var stringUtils = require('stringUtils');
  var ID_REGEXP = /^[a-zA-Z0-9-_.]*$/;

  var contentTypeIds = [];
  if ($scope.contentTypeIds) {
    $scope.contentTypeIds.then(function (ctIds) {
      contentTypeIds = ctIds;
    });
  }

  $scope.$watch('newContentTypeForm.contentTypeId', function (ctrl) {
    if (!ctrl) { return; }

    ctrl.errorDetails = {
      unique: {message: 'A content type with this ID already exists'},
      format: {message: 'Please use only letters, numbers and underscores'},
      length: {message: 'Please shorten the text so it’s no longer than 64 characters'}
    };

    ctrl.$validators.unique = function (value) {
      return !_.includes(contentTypeIds, value);
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
