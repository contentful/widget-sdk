import * as K from 'core/utils/kefir';
import { keys } from 'lodash';
import mitt from 'mitt';
import { user$ } from 'services/TokenStore';
import installTracking from './Tracking';
import { bootstrapEntryEditorLoadEvents } from 'app/entity_editor/LoadEventTracker';
import setLocaleData from 'app/entity_editor/setLocaleData';
import { valuePropertyAt } from 'app/entity_editor/Document';

import { getModule } from 'core/NgRegistry';
import createEntrySidebarProps from 'app/EntrySidebar/EntitySidebarBridge';
import { getVariation, FLAGS } from 'LaunchDarkly';
import * as Analytics from 'analytics/Analytics';

import { trackIsCommentsAlphaEligible } from '../EntrySidebar/CommentsPanel/analytics';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes';
import { getAllForEntry } from 'data/CMA/CommentsRepo';
import initSidebarTogglesProps from 'app/entity_editor/entityEditorSidebarToggles';
import { appendDuplicateIndexToEntryTitle, alignSlugWithEntryTitle } from './entityHelpers';
import { getEditorState } from './editorState';

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
 * @param {Object} $scope
 * @param {Object} editorData
 * @param {boolean} preferences.hasInitialFocus
 * @param {boolean} preferences.showDisabledFields
 * @scope.requires {Data.FieldControl[]} formControls
 *   Passed to FormWidgetsController to render field controls
 */
export default async function create($scope, editorData, preferences, trackLoadEvent) {
  const $controller = getModule('$controller');
  const spaceContext = getModule('spaceContext');
  const $rootScope = getModule('$rootScope');
  const spaceId = spaceContext.space.getId();

  $scope.context = {};
  $scope.context.ready = true;
  $scope.editorData = editorData;
  $scope.loadEvents = K.createStreamBus($scope);
  $scope.sidebarToggleProps = initSidebarTogglesProps($rootScope, $scope);
  const { entityInfo } = editorData;
  $scope.entityInfo = entityInfo;

  $scope.getOtDoc = () => $scope.otDoc;
  $scope.getEditorData = () => editorData;
  $scope.getSpace = () => spaceContext.getSpace();

  $scope.localeData = {};

  const contentType = {
    id: entityInfo.contentTypeId,
    type: spaceContext.publishedCTs.get(entityInfo.contentTypeId),
  };

  const scopeLifeline = K.scopeLifeline($scope);
  const currentSlideLevel = Object.keys($scope.slideStates || {}).length;
  const editorState = getEditorState({
    editorData,
    editorType: currentSlideLevel > 1 ? 'slide_in_editor' : 'entry_editor',
    spaceContext,
    getTitle: () => $scope.title,
    onStateUpdate: (state) => {
      $scope.state = state;
      $scope.$applyAsync();
    },
    onTitleUpdate: ({ title, truncatedTitle }) => {
      $scope.context.title = title;
      $scope.title = truncatedTitle;
    },
    lifeline: scopeLifeline,
    currentSlideLevel,
    hasInitialFocus: preferences.hasInitialFocus,
  });

  const { doc, editorContext } = editorState;

  $scope.editorContext = editorContext;
  $scope.otDoc = doc;

  /**
   * @type {EntityDocument}
   */
  bootstrapEntryEditorLoadEvents($scope, $scope.loadEvents, editorData, trackLoadEvent);

  installTracking(entityInfo, doc, scopeLifeline);

  $scope.entryActions = {
    onAdd: () => {
      Analytics.track('entry_editor:created_with_same_ct', {
        contentTypeId: contentType.id,
        entryId: entityInfo.id,
      });

      return spaceContext.space.createEntry(contentType.id, {}).then((entry) => {
        Analytics.track('entry:create', {
          eventOrigin: 'entry-editor',
          contentType: contentType.type.data,
          response: entry.data,
        });
        return entry;
      });
    },
    onDuplicate: () => {
      const currentFields = K.getValue(valuePropertyAt(doc, ['fields']));
      const displayFieldId = contentType.type.data.displayField;
      const displayFieldControl =
        contentType.type.data.fields.find((field) => field.id === displayFieldId) || {};
      const currentFieldsWithIndexedDisplayField = appendDuplicateIndexToEntryTitle(
        currentFields,
        displayFieldId
      );
      const slugControl = editorData.editorInterface.controls.find(
        (control) => control.widgetId === 'slugEditor'
      );
      // [PUL-809] We update the slug with the same index that was set on the displayField
      if (slugControl) {
        const slugField = contentType.type.data.fields.find((field) =>
          [field.apiName, field.id].includes(slugControl.fieldId)
        );
        if (slugField) {
          const slugFieldData = currentFieldsWithIndexedDisplayField[slugField.id];
          const indexedSlugFieldData = alignSlugWithEntryTitle({
            entryTitleData: currentFieldsWithIndexedDisplayField[displayFieldId],
            unindexedTitleData: currentFields[displayFieldId],
            slugFieldData,
            isRequired: slugField.required,
            isEntryTitleLocalized: displayFieldControl.localized,
          });

          if (indexedSlugFieldData) {
            currentFieldsWithIndexedDisplayField[slugField.id] = indexedSlugFieldData;
          }
        }
      }

      return spaceContext.space
        .createEntry(contentType.id, {
          fields: currentFieldsWithIndexedDisplayField,
        })
        .then((entry) => {
          Analytics.track('entry:create', {
            eventOrigin: 'entry-editor__duplicate',
            contentType: contentType.type.data,
            response: entry.data,
          });
          return entry;
        });
    },
    onShowDisabledFields: () => {
      const show = ($scope.preferences.showDisabledFields = !$scope.preferences.showDisabledFields);
      Analytics.track('entry_editor:disabled_fields_visibility_toggled', {
        entryId: entityInfo.id,
        show: show,
      });
      return show;
    },
  };

  $scope.user = K.getValue(user$);

  K.onValueScope($scope, doc.state.isDirty$, (isDirty) => {
    $scope.context.dirty = isDirty;
  });

  $scope.localeData = {};

  $scope.emitter = mitt();

  $scope.entrySidebarProps = createEntrySidebarProps({
    $scope,
    emitter: $scope.emitter,
  });

  setLocaleData($scope, {
    entityLabel: 'entry',
    shouldHideLocaleErrors: onlyFocusedLocaleHasErrors,
    emitter: $scope.emitter,
  });

  // TODO replace with `filterWidgets()` in component
  $controller('FormWidgetsController', {
    $scope,
    controls: editorData.fieldControls,
  });

  $scope.$watch('localeData.focusedLocale.name', (localeName) => {
    $scope.noLocalizedFieldsAdviceProps = { localeName };
  });

  function onlyFocusedLocaleHasErrors() {
    const { errors, focusedLocale } = $scope.localeData;
    const localeCodes = keys(errors);
    return localeCodes.length === 1 && localeCodes[0] === focusedLocale.internal_code;
  }

  getVariation(FLAGS.ENTRY_COMMENTS, {
    organizationId: spaceContext.getData('organization.sys.id'),
    spaceId,
  }).then((isEnabled) => {
    if (isEnabled) {
      $scope.sidebarToggleProps.commentsToggle.isEnabled = isEnabled;
      trackIsCommentsAlphaEligible();
      initComments($scope, spaceContext.endpoint, entityInfo.id);
    }
  });
}

function initComments($scope, endpoint, entityId) {
  // Showing the count is low-priority so we can defer fetching it
  if (window.requestIdleCallback !== undefined) {
    window.requestIdleCallback(maybeFetchCommentsCount);
  } else {
    const sensibleDelay = 1000;
    setTimeout(maybeFetchCommentsCount, sensibleDelay);
  }

  $scope.shouldDisplayCommentsToggle = true;
  $scope.emitter.on(SidebarEventTypes.UPDATED_COMMENTS_COUNT, setCommentsCount);

  async function maybeFetchCommentsCount() {
    if ($scope.sidebarToggleProps.commentsToggle.commentsCount === undefined) {
      const { items: comments } = await getAllForEntry(endpoint, entityId);
      setCommentsCount(comments.length);
    }
  }

  function setCommentsCount(commentsCount) {
    $scope.sidebarToggleProps.commentsToggle.commentsCount = commentsCount;
  }
}
