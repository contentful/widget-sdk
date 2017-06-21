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
  var Validator = require('app/entity_editor/Validator');
  var localeStore = require('TheLocaleStore');
  var Focus = require('app/entity_editor/Focus');
  var installTracking = require('app/entity_editor/Tracking').default;
  var deepFreeze = require('utils/DeepFreeze').deepFreeze;
  var initDocErrorHandler = require('app/entity_editor/DocumentErrorHandler').default;
  var contextHistory = require('contextHistory');

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

  this.validator = Validator.createForEntry(
    entityInfo.contentType,
    $scope.otDoc,
    spaceContext.publishedCTs,
    localeStore.getPrivateLocales()
  );

  $scope.state = $controller('entityEditor/StateController', {
    $scope: $scope,
    entity: editorData.entity,
    notify: notify,
    validator: this.validator,
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


  // TODO We assume that the current state has already been added to
  // the history. This is done in 'state/entries.js'. We should
  // consolidate this.
  $scope.$on('scroll-editor', function (_ev, scrollTop) {
    contextHistory.extendCurrent({scroll: scrollTop});
  });

  var startScroll = contextHistory.getLast().scroll;
  if (startScroll) {
    $scope.initialEditorScroll = startScroll;
  } else {
    // The first input element of the editor will become focused once
    // the document is loaded and the editor will scroll to that
    // position.
    this.hasInitialFocus = true;
  }


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
}]);
