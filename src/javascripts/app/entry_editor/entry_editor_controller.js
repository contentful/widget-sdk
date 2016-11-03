'use strict';

angular.module('contentful')
/**
 * @ngdoc type
 * @name EntryEditorController
 * @description
 * Main controller for the entry editor that is exposed as
 * `editorContext`.
 *
 * The scope properties this controller depends on are provided by the
 * entry state controller.
 *
 * This controller can be mocked with the `mocks/entryEditor/Context`
 * service.
 *
 * TODO this controller shares a lot of code with the
 * AssetEditorController.
 *
 * TODO instead of exposing the sub-controllers on the scope we should
 * expose them on this controller.
 *
 * @scope.requires {Client.Entity} entry
 * @scope.requires {Client.Entity} entity
 * @scope.requires {Client.ContentType} contentType
 * @scope.requires {Data.FieldControl[]} formControls
 *   Passed to FormWidgetsController to render field controls
 */
.controller('EntryEditorController', ['$scope', 'require', function EntryEditorController ($scope, require) {
  var $controller = require('$controller');
  var spaceContext = require('spaceContext');
  var notifier = require('entryEditor/notifications');
  var truncate = require('stringUtils').truncate;
  var accessChecker = require('accessChecker');
  var DataFields = require('EntityEditor/DataFields');
  var ContentTypes = require('data/ContentTypes');
  var K = require('utils/kefir');
  var Validator = require('entityEditor/Validator');
  var createEntrySchema = require('validation').fromContentType;
  var localeStore = require('TheLocaleStore');
  var errorMessageBuilder = require('errorMessageBuilder');

  var notify = notifier(function () {
    return '“' + $scope.title + '”';
  });

  $scope.locales = $controller('entityEditor/LocalesController');

  // TODO rename the scope property
  $scope.otDoc = $controller('entityEditor/Document', {
    $scope: $scope,
    entity: $scope.entity,
    contentType: $scope.contentType
  });

  $scope.state = $controller('entityEditor/StateController', {
    $scope: $scope,
    entity: $scope.entry,
    notify: notify,
    handlePublishError: handlePublishError,
    otDoc: $scope.otDoc
  });

  $scope.actions = $controller('EntryActionsController', {
    $scope: $scope,
    notify: notify
  });

  $scope.notifications = $controller('entityEditor/StatusNotificationsController', {
    $scope: $scope,
    entityLabel: 'entry',
    isReadOnly: isReadOnly
  });

  var schema = createEntrySchema($scope.contentType.data, localeStore.getPrivateLocales());
  var buildMessage = errorMessageBuilder(spaceContext.publishedCTs);
  var validator = Validator.create(buildMessage, schema, function () {
    return $scope.otDoc.getValueAt([]);
  });
  validator.run();
  this.validator = validator;

  $scope.$watch(function () {
    return spaceContext.entryTitle($scope.entry);
  }, function (title) {
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  K.onValueScope($scope, $scope.otDoc.state.isDirty, function (isDirty) {
    $scope.context.dirty = isDirty;
  });

  // OT Stuff
  $scope.$watch(function entryEditorDisabledWatcher () {
    return $scope.entry.isArchived() || isReadOnly();
  }, $scope.otDoc.setReadOnly);


  // Building the form
  $controller('FormWidgetsController', {
    $scope: $scope,
    contentTypeId: $scope.contentType.getId(),
    controls: $scope.formControls
  });


  $scope.$watch('entry.data.fields', function (fields) {
    if (!fields) {
      $scope.entry.data.fields = {};
    }
  });

  /**
   * Build the `entry.fields` api of the widget-sdk at one
   * place and put it on $scope so that we don't rebuild it
   * for every widget. Instead, we share this version in every
   * cfWidgetApi instance.
   */
  var contentTypeData = $scope.contentType.data;
  var fields = contentTypeData.fields;
  $scope.fields = DataFields.create(fields, $scope.otDoc);
  $scope.transformedContentTypeData = ContentTypes.internalToPublic(contentTypeData);


  /**
   * TODO This is way to complicated: We should only care about the
   * errors in `body.details.errors` and expose them to the scope so
   * that they can be displayed at the proper location and show a
   * simple notification.
   *
   * For this to happen the CMA needs to be refactored.
   */
  function handlePublishError (err) {
    validator.setApiResponseErrors(err);

    var errorId = dotty.get(err, 'body.sys.id');
    if (errorId === 'ValidationFailed') {
      notify.publishValidationFail();
    } else if (errorId === 'VersionMismatch') {
      notify.publishFail('Can only publish most recent version');
    } else if (errorId === 'UnresolvedLinks') {
      notify.publishFail('Some linked entries are missing.');
    } else if (errorId === 'InvalidEntry') {
      if (isLinkValidationError(err)) {
        notify.publishFail(getLinkValidationErrorMessage(err));
      } else if (err.body.message === 'Validation error') {
        notify.publishValidationFail();
      } else {
        notify.publishServerFail(err);
      }
    } else {
      notify.publishServerFail(err);
    }
  }

  function isLinkValidationError (err) {
    var errors = dotty.get(err, 'body.details.errors');
    return err.body.message === 'Validation error' &&
             errors.length > 0 &&
             errors[0].name === 'linkContentType';
  }

  function getLinkValidationErrorMessage (err) {
    var error = _.first(dotty.get(err, 'body.details.errors'));
    var contentTypeId = _.first(error.contentTypeId);
    var contentType = spaceContext.publishedCTs.get(contentTypeId);
    if (contentType) {
      return error.details.replace(contentTypeId, contentType.data.name);
    } else {
      return 'This reference requires an entry of an unexistent content type';
    }
  }

  function isReadOnly () {
    return !accessChecker.canUpdateEntry($scope.entry);
  }
}]);
