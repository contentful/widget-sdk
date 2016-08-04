'use strict';

angular.module('contentful')
.controller('EntryEditorController', ['$scope', 'require', function EntryEditorController ($scope, require) {
  var $controller = require('$controller');
  var spaceContext = require('spaceContext');
  var notifier = require('entryEditor/notifications');
  var truncate = require('stringUtils').truncate;
  var accessChecker = require('accessChecker');
  var DataFields = require('EntityEditor/DataFields');
  var ContentTypes = require('data/ContentTypes');
  var K = require('utils/kefir');

  var notify = notifier(function () {
    return '“' + $scope.title + '”';
  });

  $scope.locales = $controller('entityEditor/LocalesController');

  $scope.state = $controller('entityEditor/StateController', {
    $scope: $scope,
    entity: $scope.entry,
    notify: notify,
    handlePublishError: handlePublishError
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

  // TODO rename the scope property
  $scope.otDoc = $controller('entityEditor/Document', {
    $scope: $scope,
    entity: $scope.entity,
    contentType: $scope.contentType
  });

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
  }, function entryEditorDisabledHandler (disabled) {
    if (disabled) {
      $scope.otDoc.close();
    } else {
      $scope.otDoc.open();
    }
  });

  $scope.$watch('entry.getPublishedVersion()', function (publishedVersion, oldVersion, scope) {
    if (publishedVersion > oldVersion) scope.validate();
  });

  // We cannot call the method immediately since the directive is only
  // added to the scope afterwards
  $scope.$applyAsync(function () {
    if (!_.isEmpty($scope.entry.data.fields)) $scope.validate();
  });


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
    var errorId = dotty.get(err, 'body.sys.id');
    if (errorId === 'ValidationFailed') {
      setValidationErrors(err);
      notify.publishValidationFail();
    } else if (errorId === 'VersionMismatch') {
      notify.publishFail('Can only publish most recent version');
    } else if (errorId === 'UnresolvedLinks') {
      setValidationErrors(err);
      notify.publishFail('Some linked entries are missing.');
    } else if (errorId === 'InvalidEntry') {
      if (isLinkValidationError(err)) {
        notify.publishFail(getLinkValidationErrorMessage(err));
        setValidationErrors(err);
      } else if (err.body.message === 'Validation error') {
        setValidationErrors(err);
        notify.publishValidationFail();
      } else {
        notify.publishServerFail(err);
      }
    } else {
      notify.publishServerFail(err);
    }
  }

  function setValidationErrors (err) {
    $scope.validator.setErrors(dotty.get(err, 'body.details.errors'));
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
    var contentType = _.find(spaceContext.publishedContentTypes, {data: {sys: {id: contentTypeId}}});
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
