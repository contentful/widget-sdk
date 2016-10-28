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
  var makeNotify = require('app/entity_editor/Notifications').makeNotify;
  var truncate = require('stringUtils').truncate;
  var DataFields = require('EntityEditor/DataFields');
  var ContentTypes = require('data/ContentTypes');
  var K = require('utils/kefir');
  var Validator = require('entityEditor/Validator');
  var createEntrySchema = require('validation').fromContentType;
  var localeStore = require('TheLocaleStore');
  var errorMessageBuilder = require('errorMessageBuilder');
  var deepFreeze = require('utils/DeepFreeze').deepFreeze;
  var Focus = require('app/entity_editor/Focus');

  var editorData = $scope.editorData;

  var notify = makeNotify('Entry', function () {
    return '“' + $scope.title + '”';
  });

  $scope.locales = $controller('entityEditor/LocalesController');

  // Static meta data related to an entity
  $scope.entityInfo = deepFreeze({
    id: editorData.entity.data.sys.id,
    type: editorData.entity.data.sys.type,
    contentTypeId: editorData.contentType.data.sys.id,
    // TODO Normalize CT data if this property is used by more advanced
    // services like the 'Document' controller and the 'cfEntityField'
    // directive. Normalizing means that we set external field IDs from
    // internal ones, etc. See for example 'data/editingInterfaces/transformer'
    contentType: _.cloneDeep(editorData.contentType.data)
  });

  // TODO rename the scope property
  $scope.otDoc = spaceContext.docPool.get(
    // TODO put $scope.user on editorData and pass it as the only
    // argument
    editorData.entity,
    editorData.contentType,
    $scope.user,
    // TODO: pass a lifecycle observable
    {autoDispose: {scope: $scope}}
  );

  var schema = createEntrySchema($scope.entityInfo.contentType, localeStore.getPrivateLocales());
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
    fields$: $scope.otDoc.valuePropertyAt(['fields']),
    entityInfo: $scope.entityInfo,
    preferences: $scope.preferences
  });

  this.focus = Focus.create();

  // TODO we should use the path to the title field!
  K.onValueScope($scope, $scope.otDoc.valuePropertyAt([]), function (data) {
    var title = spaceContext.entryTitle({
      getContentTypeId: _.constant($scope.entityInfo.contentTypeId),
      data: data
    });
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  K.onValueScope($scope, $scope.otDoc.state.isDirty$, function (isDirty) {
    $scope.context.dirty = isDirty;
  });


  // Building the form
  $controller('FormWidgetsController', {
    $scope: $scope,
    controls: editorData.fieldControls.form
  });

  $scope.sidebarControler = editorData.fieldControls.sidebar;

  /**
   * Build the `entry.fields` api of the widget-sdk at one
   * place and put it on $scope so that we don't rebuild it
   * for every widget. Instead, we share this version in every
   * cfWidgetApi instance.
   */
  var contentTypeData = editorData.contentType;
  var fields = contentTypeData.fields;
  $scope.fields = DataFields.create(fields, $scope.otDoc);
  $scope.transformedContentTypeData = ContentTypes.internalToPublic(contentTypeData);
}]);
