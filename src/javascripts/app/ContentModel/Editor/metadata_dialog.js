'use strict';

angular.module('contentful')

/**
 * @ngdoc service
 * @name contentTypeEditor/metadataDialog
 */
.factory('contentTypeEditor/metadataDialog', ['require', require => {
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
    scope.duplicate = Command.create(() => {
      var d = scope.dialog;
      var form = d.formController;

      if (scope.contentTypeMetadata.name && scope.contentTypeMetadata.id) {
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
    }).promise.then(() => scope.contentTypeMetadata);
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
.controller('ContentTypeMetadataController', ['$scope', 'require', ($scope, require) => {
  const stringUtils = require('stringUtils');
  const ID_REGEXP = /^[a-zA-Z0-9-_.]*$/;

  const newContentTypeFormState = {
    idFieldTouched: false,
    idFieldRequiredMessage: '',
    nameFieldRequiredMessage: '',
    formFieldErrors: {},
    pristine: true
  };

  let contentTypeIds = [];
  if ($scope.contentTypeIds) {
    $scope.contentTypeIds.then(ctIds => {
      contentTypeIds = ctIds;
    });
  }

  const validateField = (value, fieldKey) => {
    const errorDetails = {
      unique: {
        message: 'A content type with this ID already exists',
        validator: value => !_.includes(contentTypeIds, value)
      },
      format: {
        message: 'Please use only letters, numbers and underscores',
        validator: value => ID_REGEXP.test(value)
      },
      length: {
        message: 'Please shorten the text so it’s no longer than 64 characters',
        validator: value => value.length <= 64
      }
    };

    const errorKeys = Object.keys(errorDetails).filter(key => {
      return !errorDetails[key].validator(value);
    });

    newContentTypeFormState.formFieldErrors[fieldKey] = !!errorKeys.length;
    return errorKeys.length ? errorDetails[errorKeys[0]].message : undefined;
  };

  const validateRequiredField = (fieldValue, message, fieldKey) => {
    newContentTypeFormState.formFieldErrors[fieldKey] = !fieldValue || fieldValue.length === 0;
    return newContentTypeFormState.formFieldErrors[fieldKey] ? message : undefined;
  };

  $scope.isNewContentTypeFormClean = () =>
    !Object.keys(newContentTypeFormState.formFieldErrors)
      .filter(key => newContentTypeFormState.formFieldErrors[key]).length &&
    !newContentTypeFormState.pristine &&
    $scope.contentTypeMetadata.name &&
    $scope.contentTypeMetadata.id;

  $scope.buildNameTextFieldProps = () => ({
    value: $scope.contentTypeMetadata.name,
    labelText: 'Name',
    required: true,
    name: 'contentTypeName',
    id: 'contentTypeName',
    extraClassNames: 'vertical-form-field-rythm-dense',
    validationMessage: newContentTypeFormState.nameFieldRequiredMessage,
    onChange: (e) => {
      newContentTypeFormState.pristine = false;
      $scope.contentTypeMetadata.name = e.target.value;
      newContentTypeFormState.nameFieldRequiredMessage =
        validateRequiredField($scope.contentTypeMetadata.name, 'Name is required', 'nameRequired');
    },
    onBlur: () => {
      newContentTypeFormState.nameFieldRequiredMessage =
        validateRequiredField($scope.contentTypeMetadata.name, 'Name is required', 'nameRequired');
    },
    textInputProps: {
      maxLength: 64,
      placeholder: $scope.namePlaceholder
    }
  });

  $scope.buildApiIdTextFieldProps = () => ({
    value: $scope.contentTypeMetadata.id,
    labelText: 'Api Identifier',
    required: true,
    name: 'contentTypeId',
    id: 'contentTypeId',
    helpText: 'generated from name',
    extraClassNames: 'vertical-form-field-rythm-dense',
    validationMessage: validateField($scope.contentTypeMetadata.id, 'apiId') ||
      newContentTypeFormState.idFieldRequiredMessage,
    onChange: (e) => {
      newContentTypeFormState.idFieldTouched = true;
      newContentTypeFormState.pristine = false;
      $scope.contentTypeMetadata.id = stringUtils.toIdentifier(e.target.value);
      newContentTypeFormState.idFieldRequiredMessage =
        validateRequiredField($scope.contentTypeMetadata.id, 'Api key is required', 'apiIdRequired');
    },
    onBlur: () => {
      newContentTypeFormState.idFieldRequiredMessage =
        validateRequiredField($scope.contentTypeMetadata.id, 'Api key is required', 'apiIdRequired');
    },
    textInputProps: {
      maxLength: 64
    }
  });

  $scope.buildDescriptionTextFieldProps = () => ({
    value: $scope.contentTypeMetadata.description,
    labelText: 'Description',
    helpText: 'in less than 500 characters',
    name: 'contentTypeDescription',
    id: 'contentTypeDescription',
    extraClassNames: 'vertical-form-field-rythm-dense',
    onChange: (e) => {
      newContentTypeFormState.pristine = false;
      $scope.contentTypeMetadata.description = e.target.value;
    },
    textInputProps: {
      maxLength: 500
    },
    textarea: true
  });

  $scope.$watch('contentTypeMetadata.name', name => {
    if (!newContentTypeFormState.idFieldTouched) {
      $scope.contentTypeMetadata.id = stringUtils.toIdentifier(name);
    }
  });
}]);
