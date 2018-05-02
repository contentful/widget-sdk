import $controller from '$controller';

import {deepFreeze} from 'utils/Freeze';
import * as K from 'utils/kefir';
import {truncate} from 'stringUtils';
import {cloneDeep, find, constant} from 'lodash';

import spaceContext from 'spaceContext';
import notifications from 'notification';
import localeStore from 'TheLocaleStore';
import contextHistory from 'navigation/Breadcrumbs/History';

import DataFields from 'EntityEditor/DataFields';
import ContentTypes from 'data/ContentTypes';
import * as crumbFactory from 'navigation/Breadcrumbs/Factory';

import * as Validator from './Validator';
import * as Focus from './Focus';
import initDocErrorHandler from './DocumentErrorHandler';
import {makeNotify} from './Notifications';
import installTracking from './Tracking';
import renderStatusNotification from './StatusNotification';


import { loadEntry } from 'app/entity_editor/DataLoader';
import { onFeatureFlag } from 'utils/LaunchDarkly';

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
export default async function create ($scope, entryId) {
  const SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG =
    'feature-at-03-2018-sliding-entry-editor';

  const editorData = await loadEntry(spaceContext, entryId);
  $scope.context.ready = true;
  $scope.editorData = editorData;

  // add list as parent state only if it's a deep link
  if (contextHistory.isEmpty()) {
    contextHistory.add(crumbFactory.EntryList());
  }

  // add current state
  contextHistory.add(crumbFactory.Entry(editorData.entity.getSys(), $scope.context));

  const editorContext = $scope.editorContext = {};
  const entityInfo = editorContext.entityInfo = editorData.entityInfo;

  const notify = makeNotify('Entry', function () {
    return '“' + $scope.title + '”';
  });

  $scope.entityInfo = entityInfo;

  $scope.locales = $controller('entityEditor/LocalesController');

  const doc = editorData.openDoc(K.scopeLifeline($scope));
  // TODO rename the scope property
  $scope.otDoc = doc;
  initDocErrorHandler($scope, doc.state.error$);

  K.onValueScope($scope, doc.status$, (status) => {
    $scope.entityStatusComponent = renderStatusNotification(status, 'entry');
  });

  installTracking(entityInfo, doc, K.scopeLifeline($scope));

  editorContext.validator = Validator.createForEntry(
    entityInfo.contentType,
    $scope.otDoc,
    spaceContext.publishedCTs,
    localeStore.getPrivateLocales()
  );

  $scope.state = $controller('entityEditor/StateController', {
    $scope: $scope,
    entity: editorData.entity,
    notify: notify,
    validator: editorContext.validator,
    otDoc: $scope.otDoc
  });

  $scope.actions = $controller('EntryActionsController', {
    $scope: $scope,
    notify: notify,
    fields$: doc.valuePropertyAt(['fields']),
    entityInfo: entityInfo,
    preferences: $scope.preferences
  });

  editorContext.focus = Focus.create();

  // TODO Move this into a separate function
  K.onValueScope($scope, doc.valuePropertyAt([]), function (data) {
    const title = spaceContext.entryTitle({
      getContentTypeId: constant(entityInfo.contentTypeId),
      data: data
    });
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  editorContext.editReferences = function (field, locale, index, cb) {
    $scope.referenceContext = createReferenceContext(field, locale, index, cb);
  };

  editorContext.createReferenceContext = createReferenceContext;

  // This will only be available if feature-at-03-2018-sliding-entry-editor
  // is not enabled.
  editorContext.toggleSlideinEditor = function () {
    $scope.inlineEditor = !$scope.inlineEditor;
  };

  function createReferenceContext (field, locale, index, cb) {
    // The links$ property should end when the editor is closed
    const lifeline = K.createBus();
    const links$ = K.endWith(
      doc.valuePropertyAt(['fields', field, locale]),
      lifeline.stream
    ).map((links) => links || []);

    notifications.clearSeen();
    return {
      links$: links$,
      focusIndex: index,
      editorSettings: deepFreeze(cloneDeep($scope.preferences)),
      parentId: entityInfo.id,
      field: find(entityInfo.contentType.fields, {id: field}),
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
  }

  $scope.$on('scroll-editor', function (_ev, scrollTop) {
    contextHistory.extendCurrent({scroll: scrollTop});
  });

  const startScroll = contextHistory.getLast().scroll;
  if (startScroll) {
    $scope.initialEditorScroll = startScroll;
  } else {
    // The first input element of the editor will become focused once
    // the document is loaded and the editor will scroll to that
    // position.
    editorContext.hasInitialFocus = true;
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
  const contentTypeData = entityInfo.contentType;
  const fields = contentTypeData.fields;
  $scope.fields = DataFields.create(fields, $scope.otDoc);
  $scope.transformedContentTypeData = ContentTypes.internalToPublic(contentTypeData);

  onFeatureFlag($scope, SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG, (isEnabled) => {
    $scope.shouldShowBreadcrumbs = !isEnabled;
  });
}
