'use strict';

angular.module('contentful')
.controller('EntryEditorController', ['$scope', '$injector', function EntryEditorController ($scope, $injector) {
  var $controller = $injector.get('$controller');
  var spaceContext = $injector.get('spaceContext');
  var notifier = $injector.get('entryEditor/notifications');
  var truncate = $injector.get('stringUtils').truncate;
  var accessChecker = $injector.get('accessChecker');
  var ShareJS = $injector.get('ShareJS');
  var DataFields = $injector.get('EntityEditor/DataFields');
  var ContentTypes = $injector.get('data/ContentTypes');

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

  $controller('entityEditor/FieldAccessController', {$scope: $scope});

  $scope.$watch(function () {
    return spaceContext.entryTitle($scope.entry);
  }, function (title) {
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });


  $scope.$watch(function (scope) {
    if (scope.otDoc.doc && scope.entry) {
      if (angular.isDefined(scope.entry.getPublishedVersion())) {
        return scope.otDoc.doc.version > scope.entry.getPublishedVersion() + 1;
      } else {
        return 'draft';
      }
    } else {
      return undefined;
    }
  }, function (modified, _old, scope) {
    if (modified !== undefined) scope.context.dirty = modified;
  });

  // OT Stuff
  $scope.$watch(function entryEditorDisabledWatcher () {
    return $scope.entry.isArchived() || isReadOnly();
  }, function entryEditorDisabledHandler (disabled) {
    $scope.otDoc.state.disabled = disabled;
  });

  $scope.$watch('entry.getPublishedVersion()', function (publishedVersion, oldVersion, scope) {
    if (publishedVersion > oldVersion) scope.validate();
  });

  var firstValidate = $scope.$on('otBecameEditable', function (event) {
    var scope = event.currentScope;
    if (!_.isEmpty(scope.entry.data.fields)) scope.validate();
    firstValidate();
    firstValidate = null;
  });

  // Building the form
  $controller('FormWidgetsController', {
    $scope: $scope,
    contentTypeId: $scope.contentType.getId(),
    controls: $scope.formControls
  });

  $scope.$watch('otDoc.doc', function (doc) {
    if (doc) {
      cleanSnapshot($scope.entry.data, doc);
    }
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
  $scope.fields = DataFields.create(fields, $scope);
  $scope.transformedContentTypeData = ContentTypes.internalToPublic(contentTypeData);

  /**
   * Makes sure that the snapshot of the OT doc looks like the object
   * we get from the CMA. In particular each field should be undefined
   * or an object that maps locales to values.
   *
   * TODO It is unclear if this is necessary. There might be some
   * corrupt data where a field is not an object.
   */
  function cleanSnapshot (entryData, doc) {
    _.forEach(entryData.fields, function (_field, id) {
      var docField = ShareJS.peek(doc, ['fields', id]);
      if (!_.isObject(docField)) {
        ShareJS.setDeep(doc, ['fields', id], {});
      }
    });
  }

  /**
   * TODO This is way to complicated: We should only care about the
   * errors in `body.details.errors` and expose them to the scope so
   * that they can be displayed at the proper location and show a
   * simple notifictation.
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
