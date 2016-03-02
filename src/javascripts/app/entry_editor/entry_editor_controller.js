'use strict';

angular.module('contentful')
.controller('EntryEditorController', ['$scope', '$injector', function EntryEditorController($scope, $injector) {
  var $controller    = $injector.get('$controller');
  var logger         = $injector.get('logger');
  var TheLocaleStore = $injector.get('TheLocaleStore');
  var spaceContext   = $injector.get('spaceContext');
  var fieldFactory   = $injector.get('fieldFactory');
  var notifier       = $injector.get('entryEditor/notifications');
  var truncate       = $injector.get('stringUtils').truncate;
  var accessChecker  = $injector.get('accessChecker');

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
      if (angular.isDefined(scope.entry.getPublishedVersion()))
        return scope.otDoc.doc.version > scope.entry.getPublishedVersion() + 1;
      else
        return 'draft';
    } else {
      return undefined;
    }
  }, function (modified, old, scope) {
    if (modified !== undefined) scope.context.dirty = modified;
  });

  // OT Stuff
  $scope.$watch(function entryEditorDisabledWatcher() {
    return $scope.entry.isArchived() || isReadOnly();
  }, function entryEditorDisabledHandler(disabled) {
    $scope.otDoc.state.disabled = disabled;
  });

  // Validations
  $scope.errorPaths = {};
  $scope.$watch('entry.getPublishedVersion()', function (publishedVersion, oldVersion, scope) {
    if (publishedVersion > oldVersion) scope.validate();
  });

  var firstValidate = $scope.$on('otBecameEditable', function (event) {
    var scope = event.currentScope;
    if (!_.isEmpty(scope.entry.data.fields)) scope.validate();
    firstValidate();
    firstValidate = null;
  });

  $scope.$watch('validationResult.errors', function (errors) {
    $scope.errorPaths = {};
    $scope.hasErrorOnFields = false;

    _.each(errors, function (error) {
      if (error.path[0] !== 'fields') return;
      var fieldId      = error.path[1];
      var field        = _.find($scope.contentType.data.fields, {id: fieldId});

      if(error.path.length > 1) {
        $scope.errorPaths[fieldId] = $scope.errorPaths[fieldId] || [];
      }

      if (!field) {
        logger.logError('Field object does not exist', {
          data: {
            allErrors: errors,
            currentError: error,
            entryData: $scope.entry.data,
            entryFields: $scope.contentType.data.fields
          }
        });
        return;
      }

      if (error.path.length == 1 && error.path[0] == 'fields') {
        $scope.hasErrorOnFields = error.path.length == 1 && error.path[0] == 'fields';
      } else if (error.path.length == 2) {
        var localeCodes = fieldFactory.getLocaleCodes(field);
        $scope.errorPaths[fieldId].push.apply($scope.errorPaths[fieldId], localeCodes);
      } else {
        var localeCode = error.path[2];
        $scope.errorPaths[fieldId].push(localeCode);
      }
      $scope.errorPaths[fieldId] = _.unique($scope.errorPaths[fieldId]);
    });
  });

  // Building the form
  $controller('FormWidgetsController', {
    $scope: $scope,
    contentTypeId: $scope.contentType.getId(),
    controls: $scope.formControls
  });

  var contentTypeFields = $scope.contentType.data.fields;
  if(contentTypeFields && contentTypeFields.length > 0){
    cleanupEntryFields(contentTypeFields);
  }


  // Helper methods on the scope
  $scope.getFieldValidationsOfType = function(field, type) {//TODO this should go in a service
    return _.filter(_.pluck(field.validations, type))[0];
  };


  $scope.$watch('entry.data.fields', function (fields) {
    if (!fields) {
      $scope.entry.data.fields = {};
    }
  });

  // Prevents badly created fields via the API from breaking the editor
  function cleanupEntryFields(contentTypeFields) {
    // FIXME Because of the `::` eval once feature of AngularJS this
    // code highly relies on undefined vs. falsy semantics and hides
    // the fact that we only want to execute this once.
    // Instead We should remove the watcher once the cleanup is done.
    $scope.$watchGroup(['::entry', '::otDoc.doc'], function (values) {
      if(!_.isEmpty($scope.entry.data.fields) && areValuesDefined(values)){
        _.each($scope.entry.data.fields, _.partial(setupFieldLocales, contentTypeFields));
      }
    });
  }

  function areValuesDefined(values) {
    return _.all(values, function(val){return !_.isUndefined(val);});
  }

  /*
   * If a field is null or empty, initializes it with the necessary locale
   * placeholder objects
   *
   * TODO: Check if this function can be removed entirely. After doing some
   * inspections on the data before and after manipulating the shareJS object
   * it seems like calling `$scope.otDoc.doc.at([fields, id]).set(newField)`
   * doesn't do very much if `newField` contains keys where values are
   * undefined.
   * Setting keys to undefined solves BUG#6696, but doesn't persist data to
   * shareJS. Inspect if this can be removed entirely if it doesn't break
   * anything.
   */
  function setupFieldLocales(contentTypeFields, field, fieldId) {
    //1) If the field is a primitive, e.g an object, function, regex.
    //Note: new String() or new Number() are not considered primitives to lodash
    //unlike number and string
    //2) If the field is an object with more than one key or a collection
    //with a length that is larger than 0
    if(!_.isObject(field) || _.isEmpty(field)){
      var newField = {};
      var fieldType = _.find(contentTypeFields, {id: fieldId});
      //Either initialize one field with the default locale or initialize all
      //localized fields depending on wether the field is localizable
      if(fieldType.localized){
        _.each(TheLocaleStore.getPrivateLocales(), function (locale) {
          newField[locale.internal_code] = undefined;
        });
      } else {
        newField[TheLocaleStore.getDefaultLocale().internal_code] = undefined;
      }
      $scope.otDoc.doc.at(['fields', fieldId]).set(newField);
    }
  }



  /**
   * TODO This is way to complicated: We should only care about the
   * errors in `body.details.errors` and expose them to the scope so
   * that they can be displayed at the proper location and show a
   * simple notifictation.
   *
   * For this to happen the CMA needs to be refactored.
   */
  function handlePublishError(err) {
    var errorId = dotty.get(err, 'body.sys.id');
    if (errorId === 'ValidationFailed') {
      setValidationErrors(err);
      notify.publishValidationFail();
    } else if (errorId === 'VersionMismatch'){
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

  function setValidationErrors(err) {
    $scope.setValidationErrors(dotty.get(err, 'body.details.errors'));
  }

  function isLinkValidationError(err) {
      var errors = dotty.get(err, 'body.details.errors');
      return err.body.message === 'Validation error' &&
             errors.length > 0 &&
             errors[0].name == 'linkContentType';
  }

  function getLinkValidationErrorMessage(err) {
    var error = _.first(dotty.get(err, 'body.details.errors'));
    var contentTypeId = _.first(error.contentTypeId);
    var contentType = _.findWhere(spaceContext.publishedContentTypes, {data: {sys: {id: contentTypeId}}});
    if(contentType) {
      return error.details.replace(contentTypeId, contentType.data.name);
    } else {
      return 'This reference requires an entry of an unexistent content type';
    }
  }

  function isReadOnly() {
    return !accessChecker.canUpdateEntry($scope.entry);
  }
}]);
