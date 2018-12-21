import { deepFreeze } from 'utils/Freeze.es6';
import * as K from 'utils/kefir.es6';
import { truncate } from 'utils/StringUtils.es6';
import { cloneDeep, find, constant } from 'lodash';

import contextHistory from 'navigation/Breadcrumbs/History.es6';
import { user$ } from 'services/TokenStore.es6';

import * as crumbFactory from 'navigation/Breadcrumbs/Factory.es6';

import * as Validator from './Validator.es6';
import * as Focus from './Focus.es6';
import initDocErrorHandler from './DocumentErrorHandler.es6';
import { makeNotify } from './Notifications.es6';
import installTracking, { trackEntryView } from './Tracking.es6';

import { loadEntry } from 'app/entity_editor/DataLoader.es6';
import { getModule } from 'NgRegistry.es6';

const $controller = getModule('$controller');
const $rootScope = getModule('$rootScope');
const spaceContext = getModule('spaceContext');
const localeStore = getModule('TheLocaleStore');
const $state = getModule('$state');
const logger = getModule('logger');
const DataFields = getModule('EntityEditor/DataFields');
const ContentTypes = getModule('data/ContentTypes');

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
export default async function create($scope, entryId) {
  $scope.context = {};
  let editorData;
  try {
    editorData = await loadEntry(spaceContext, entryId);
  } catch (error) {
    $scope.context.loadingError = error;
    return;
  }
  $scope.context.ready = true;
  $scope.editorData = editorData;

  // add list as parent state only if it's a deep link
  if (contextHistory.isEmpty()) {
    contextHistory.add(crumbFactory.EntryList());
  }

  // add current state
  contextHistory.add(crumbFactory.Entry(editorData.entity.getSys(), $scope.context));

  const editorContext = ($scope.editorContext = {});
  const entityInfo = (editorContext.entityInfo = editorData.entityInfo);

  const notify = makeNotify('Entry', () => '“' + $scope.title + '”');

  $scope.entityInfo = entityInfo;

  $scope.locales = $controller('entityEditor/LocalesController');

  const doc = editorData.openDoc(K.scopeLifeline($scope));
  // TODO rename the scope property
  $scope.otDoc = doc;
  initDocErrorHandler($scope, doc.state.error$);

  K.onValueScope($scope, doc.status$, status => {
    $scope.props = { status, entityLabel: 'entry' };
  });

  installTracking(entityInfo, doc, K.scopeLifeline($scope));
  try {
    trackEntryView({
      editorData,
      entityInfo,
      currentSlideLevel: $scope.$parent.entities.length,
      locale: localeStore.getDefaultLocale().internal_code,
      editorType: $scope.$parent.entities.length > 1 ? 'slide_in_editor' : 'entry_editor',
      customWidgets: (editorData.fieldControls.form || [])
        .filter(w => w.custom)
        .map(w => w.trackingData)
    });
  } catch (error) {
    logger.logError(error);
  }

  editorContext.validator = Validator.createForEntry(
    entityInfo.contentType,
    $scope.otDoc,
    spaceContext.publishedCTs,
    localeStore.getPrivateLocales()
  );

  $scope.state = $controller('entityEditor/StateController', {
    $scope,
    entity: editorData.entity,
    notify,
    validator: editorContext.validator,
    otDoc: $scope.otDoc
  });

  $scope.actions = $controller('EntryActionsController', {
    $scope,
    notify,
    fields$: doc.valuePropertyAt(['fields']),
    entityInfo,
    preferences: $scope.preferences
  });

  editorContext.focus = Focus.create();

  // TODO Move this into a separate function
  K.onValueScope($scope, doc.valuePropertyAt([]), data => {
    const title = spaceContext.entryTitle({
      getContentTypeId: constant(entityInfo.contentTypeId),
      data
    });
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  $rootScope.$on('$stateChangeStart', (_event, _toState, toParams, _fromState, fromParams) => {
    if (fromParams.bulkEditor && !toParams.bulkEditor && $scope.referenceContext) {
      $scope.referenceContext.close();
    }
  });

  editorContext.editReferences = (fieldApiName, locale, index, cb) => {
    const bulkEditorParam = { bulkEditor: `${fieldApiName}:${locale}:${index}` };
    const crumb = cloneDeep(crumbFactory.Entry(editorData.entity.data.sys, $scope.context));
    crumb.link.params = {
      ...crumb.link.params,
      ...bulkEditorParam
    };
    $state.go('.', bulkEditorParam);
    contextHistory.add(crumb);
    $scope.referenceContext = createReferenceContext(fieldApiName, locale, index, () => {
      $state.go('.', { bulkEditor: '' });
      cb();
    });
  };

  editorContext.createReferenceContext = createReferenceContext;

  function createReferenceContext(fieldApiName, locale, index, cb) {
    // The links$ property should end when the editor is closed
    const field = find(entityInfo.contentType.fields, { apiName: fieldApiName });
    const lifeline = K.createBus();
    const links$ = K.endWith(
      doc.valuePropertyAt(['fields', field.id, locale]),
      lifeline.stream
    ).map(links => links || []);

    return {
      links$,
      focusIndex: index,
      editorSettings: deepFreeze(cloneDeep($scope.preferences)),
      parentId: entityInfo.id,
      field,
      add: function(link) {
        return doc.pushValueAt(['fields', field.id, locale], link);
      },
      remove: function(index) {
        return doc.removeValueAt(['fields', field.id, locale, index]);
      },
      close: function() {
        lifeline.end();
        $scope.referenceContext = null;
        if (cb) {
          cb();
        }
      }
    };
  }

  $scope.$on('scroll-editor', (_ev, scrollTop) => {
    contextHistory.extendCurrent({ scroll: scrollTop });
  });

  $scope.user = K.getValue(user$);

  const startScroll = contextHistory.getLast().scroll;
  if (startScroll) {
    $scope.initialEditorScroll = startScroll;
  } else {
    // The first input element of the editor will become focused once
    // the document is loaded and the editor will scroll to that
    // position.
    editorContext.hasInitialFocus = true;
  }

  K.onValueScope($scope, $scope.otDoc.state.isDirty$, isDirty => {
    $scope.context.dirty = isDirty;
  });

  // Building the form
  $controller('FormWidgetsController', {
    $scope,
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
}
