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
  var notifications = require('notification');
  var makeNotify = require('app/entity_editor/Notifications').makeNotify;
  var truncate = require('stringUtils').truncate;
  var DataFields = require('EntityEditor/DataFields');
  var ContentTypes = require('data/ContentTypes');
  var K = require('utils/kefir');
  var Validator = require('entityEditor/Validator');
  var createEntrySchema = require('validation').fromContentType;
  var localeStore = require('TheLocaleStore');
  var errorMessageBuilder = require('errorMessageBuilder');
  var Focus = require('app/entity_editor/Focus');
  var installTracking = require('app/entity_editor/Tracking').default;
  var deepFreeze = require('utils/DeepFreeze').deepFreeze;
  var initDocErrorHandler = require('app/entity_editor/DocumentErrorHandler').default;
  var LD = require('utils/LaunchDarkly');
  var analytics = require('analytics/Analytics');
  var hasAccessToLearnView = require('accessChecker').getSectionVisibility().learn;
  var State = require('data/CMA/EntityState').State;
  var SumTypes = require('libs/sum-types/caseof-eq');
  var caseof = SumTypes.caseof;
  var otherwise = SumTypes.otherwise;

  var editorData = $scope.editorData;
  var entityInfo = this.entityInfo = editorData.entityInfo;

  var notify = makeNotify('Entry', function () {
    return '“' + $scope.title + '”';
  });

  $scope.entityInfo = entityInfo;

  $scope.locales = $controller('entityEditor/LocalesController');

  var doc = editorData.openDoc(K.scopeLifeline($scope));
  // TODO rename the scope property
  $scope.otDoc = doc;
  initDocErrorHandler($scope, doc.state.error$);

  installTracking(entityInfo, doc, K.scopeLifeline($scope));

  var schema = createEntrySchema(entityInfo.contentType, localeStore.getPrivateLocales());
  var buildMessage = errorMessageBuilder(spaceContext.publishedCTs);
  var validator = Validator.create(buildMessage, schema, function () {
    return $scope.otDoc.getValueAt([]);
  });
  validator.run();
  this.validator = validator;

  $scope.state = $controller('entityEditor/StateController', {
    $scope: $scope,
    entity: editorData.entity,
    notify: notify,
    validator: validator,
    otDoc: $scope.otDoc
  });

  $scope.actions = $controller('EntryActionsController', {
    $scope: $scope,
    notify: notify,
    fields$: doc.valuePropertyAt(['fields']),
    entityInfo: entityInfo,
    preferences: $scope.preferences
  });

  this.focus = Focus.create();

  // TODO Move this into a separate function
  K.onValueScope($scope, doc.valuePropertyAt([]), function (data) {
    var title = spaceContext.entryTitle({
      getContentTypeId: _.constant(entityInfo.contentTypeId),
      data: data
    });
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  this.editReferences = function (field, locale, index, cb) {
    // The links$ property should end when the editor is closed
    var lifeline = K.createBus();
    var links$ = K.endWith(
      doc.valuePropertyAt(['fields', field, locale]),
      lifeline.stream
    );

    notifications.clearSeen();
    $scope.referenceContext = {
      links$: links$,
      focusIndex: index,
      editorSettings: deepFreeze(_.cloneDeep($scope.preferences)),
      parentId: entityInfo.id,
      field: _.find(entityInfo.contentType.fields, {id: field}),
      add: function (link) {
        return doc.pushValueAt(['fields', field, locale], link);
      },
      remove: function (index) {
        return doc.removeValueAt(['fields', field, locale, index]);
      },
      close: function () {
        lifeline.end();
        $scope.referenceContext = null;
        notifications.clearSeen();
        if (cb) {
          cb();
        }
      }
    };
  };

  this.hasInitialFocus = true;

  K.onValueScope($scope, $scope.otDoc.state.isDirty$, function (isDirty) {
    $scope.context.dirty = isDirty;
  });


  // Building the form
  $controller('FormWidgetsController', {
    $scope: $scope,
    controls: editorData.fieldControls.form
  });

  $scope.sidebarControls = editorData.fieldControls.sidebar;

  /**
   * Build the `entry.fields` api of the widget-sdk at one
   * place and put it on $scope so that we don't rebuild it
   * for every widget. Instead, we share this version in every
   * cfWidgetApi instance.
   */
  var contentTypeData = entityInfo.contentType;
  var fields = contentTypeData.fields;
  $scope.fields = DataFields.create(fields, $scope.otDoc);
  $scope.transformedContentTypeData = ContentTypes.internalToPublic(contentTypeData);


  // A/B experiment - ps-03-2017-next-step-hints
  $scope.trackNextStepHint = function () {
    analytics.track('experiment:interaction', {
      experiment: {
        id: 'ps-03-2017-next-step-hints',
        variation: true,
        interaction_context: 'entry_editor'
      }
    });
  };

  var nextStepHintsTest$ = LD.get('ps-03-2017-next-step-hints');
  var notActivated = !spaceContext.getData('activatedAt');
  var learnModeOn = hasAccessToLearnView && notActivated;
  var showNextStepHint;

  var HINT_API_CALL = {
    title: 'Now let’s fetch the content using the API',
    html: '<a ui-sref="spaces.detail.learn" ng-click="trackNextStepHint()">Get an API access token</a>'
  };

  var HINT_PUBLISH = {
    title: 'Make any change and publish it',
    html: 'Click the “Publish” button on the right'
  };

  K.onValueScope($scope, nextStepHintsTest$, function (shouldShow) {
    showNextStepHint = shouldShow;

    if (learnModeOn) {
      if (_.isBoolean(showNextStepHint)) {
        analytics.track('experiment:start', {
          experiment: {
            id: 'ps-03-2017-next-step-hints',
            variation: showNextStepHint
          }
        });
      }
    }
  });

  var nextStepHint$ = K.combineProperties(
    [nextStepHintsTest$, doc.resourceState.state$],
    function (showTest, docState) {
      if (showTest && learnModeOn) {
        return caseof(docState, [
          [State.Published(), _.constant(HINT_API_CALL)],
          [State.Archived(), _.constant(null)],
          [otherwise, _.constant(HINT_PUBLISH)]
        ]);
      } else {
        return null;
      }
    }
  );

  K.onValueScope($scope, nextStepHint$, function (nextStepHint) {
    $scope.nextStepHint = nextStepHint;
  });
  // End A/B experiment - ps-03-2017-next-step-hints

}]);
