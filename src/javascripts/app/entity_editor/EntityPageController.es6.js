import { track } from 'analytics/Analytics.es6';
import * as Telemetry from 'Telemetry.es6';
import { cloneDeep, find, mapValues } from 'lodash';
import * as K from 'utils/kefir.es6';
import { deepFreeze } from 'utils/Freeze.es6';
import { getModule } from 'NgRegistry.es6';
import { createLoadEventTracker } from 'app/entity_editor/LoadEventTracker.es6';
import { loadEntry, loadAsset } from 'app/entity_editor/DataLoader.es6';
const entityLoaders = {
  Entry: loadEntry,
  Asset: loadAsset
};

const {
  getSlideInEntities,
  goToSlideInEntity,
  getSlideAsString,
  goToPreviousSlideOrExit
} = getModule('navigation/SlideInNavigator');

const spaceContext = getModule('spaceContext');

const { setTimeout, clearTimeout } = window;

const PEEK_IN_DELAY = 500;
const PEEK_OUT_DELAY = 500;
const PEEK_ANIMATION_DURATION = 200;

export const getTimestamp = () => new Date().getTime();

export default ($scope, $state) => {
  let topPeekingLayerIndex = -1;
  let peekedLayerIndexes = [];
  let hoveredLayerIndex;
  let peekInTimeoutID, peekOutTimeoutID;
  let clearPreviousPeekTimeoutID, clearPeekTimeoutID;
  let loaderTimeoutID;

  $scope.slideStates = [];
  $scope.entityLoads = {};
  $scope.editorsData = {};
  $scope.context.ready = true;

  setEntities();

  const isTopLayer = ($scope.isTopLayer = index => index + 1 === $scope.slideStates.length);

  $scope.getSlideAsString = getSlideAsString;

  $scope.getLayerClasses = index => {
    const currentlyPeekedLayerIndex = peekedLayerIndexes.slice(-1)[0];
    const optimize = $scope.slideStates.length > 4;
    return {
      [`workbench-layer--${index}`]: true,
      'workbench-layer--is-current': isTopLayer(index),
      'workbench-layer--hovered': index === hoveredLayerIndex,
      'workbench-layer--peeked': peekedLayerIndexes.includes(index),
      'workbench-layer--offset': index > currentlyPeekedLayerIndex,
      'workbench-layer--optimized': optimize
    };
  };

  $scope.close = slide => {
    clearTimeouts();
    hoveredLayerIndex = null;
    topPeekingLayerIndex = -1;
    peekedLayerIndexes = [];
    const eventData = goToSlideInEntity(slide);
    const peekHoverTimeMs = getTimestamp() - $scope.peekStart - PEEK_IN_DELAY;
    getSlideStateByKey();

    track('slide_in_editor:peek_click', {
      peekHoverTimeMs: Math.max(0, peekHoverTimeMs),
      ...eventData
    });
  };

  $scope.initPeeking = index => {
    if (isTopLayer(index)) {
      topPeekingLayerIndex = index - 1;

      peekOutTimeoutID = scopeTimeout(PEEK_OUT_DELAY, () => {
        clearPeekTimeoutID = scopeTimeout(PEEK_ANIMATION_DURATION, () => {
          peekedLayerIndexes = [];
        });
        peekedLayerIndexes.push(undefined);
      });
    }
  };

  $scope.peekIn = index => {
    const isPeekable = index <= topPeekingLayerIndex;

    if (isPeekable) {
      hoveredLayerIndex = index;
    }
    clearTimeout(peekOutTimeoutID);
    peekInTimeoutID = scopeTimeout(PEEK_IN_DELAY, () => {
      clearPreviousPeekTimeoutID = scopeTimeout(PEEK_ANIMATION_DURATION, () => {
        peekedLayerIndexes = isPeekable ? [index] : [];
      });
      if (isPeekable) {
        peekedLayerIndexes.push(index);
      }
    });
    $scope.peekStart = getTimestamp();
  };

  $scope.peekOut = () => {
    $scope.peekStart = 0;
    hoveredLayerIndex = null;
    clearTimeout(peekInTimeoutID);
    clearTimeout(clearPreviousPeekTimeoutID);
  };

  const unlistenStateChangeSuccess = $scope.$on('$locationChangeSuccess', setEntities);

  const unlistenStateChangeStart = $scope.$on(
    '$stateChangeStart',
    (_event, toState, toParams, fromState, _fromParams, options) => {
      const preventControllerReload = isRelevantState(toState) && isRelevantState(fromState);
      if (preventControllerReload) {
        options.notify = false;
        $state.params = { ...toParams };
      }
    }
  );

  $scope.$on('$destroy', () => {
    unlistenStateChangeSuccess();
    unlistenStateChangeStart();
    clearTimeouts();
  });

  function getSlideStateByKey(key) {
    return find($scope.slideStates, { key });
  }

  function setEntities() {
    const previousSlidesCount = $scope.slideStates.length;

    const slides = getSlideInEntities();
    const multipleNewSlidesAdded = previousSlidesCount + 1 < slides.length;

    $scope.slideStates = slides.reduce((slideStates, slide) => {
      const key = getSlideAsString(slide);
      slideStates.push(
        getSlideStateByKey(key) || {
          key,
          slide,
          viewProps: null,
          loadingError: null
        }
      );
      return slideStates;
    }, []);

    $scope.entityLoads = slides.reduce((entityLoads, slide, i) => {
      let entityId, entityType, buildSlideEditorViewProps;
      if (['Entry', 'Asset'].includes(slide.type)) {
        entityType = slide.type;
        entityId = slide.id;
        buildSlideEditorViewProps = (editorData, trackLoadEvent) => ({
          editorData,
          trackLoadEvent,
          preferences: { ...$scope.preferences, hasInitialFocus: i + 1 === slides.length }
        });
      } else if (slide.type === 'BulkEditor') {
        entityType = 'Entry';
        entityId = slide.path[0];
        buildSlideEditorViewProps = editorData => {
          const { entityInfo } = editorData;
          const lifeline = K.createBus();
          const onDestroy = () => lifeline.end();
          const doc = editorData.openDoc(lifeline.stream);
          return {
            referenceContext: createReferenceContext(entityInfo, doc, slide, onDestroy)
          };
        };
      } else {
        throw new Error(`Unknown slide of type "${slide.type}"`);
      }
      const maybeUpdateSlideState = updateFn => {
        const key = getSlideAsString(slide);
        const slideState = getSlideStateByKey(key);
        if (slideState) {
          updateFn(slideState);
          $scope.$digest();
        }
      };
      const updateSlideState = (editorData, trackLoadEvent) =>
        maybeUpdateSlideState(
          slideState =>
            (slideState.viewProps = buildSlideEditorViewProps(editorData, trackLoadEvent))
        );
      const setLoadingError = loadingError =>
        maybeUpdateSlideState(slideState => (slideState.loadingError = loadingError));

      const loaderKey = `${entityType}:${entityId}`;
      if (!entityLoads[loaderKey]) {
        const loadEntity = entityLoaders[entityType];
        const ongoingLoad = $scope.entityLoads[loaderKey];
        if (ongoingLoad) {
          entityLoads[loaderKey] = ongoingLoad;
        } else {
          let editorData;
          const loadStartMs = Date.now();
          const trackLoadEvent = createLoadEventTracker(
            loadStartMs,
            () => $scope.slideStates,
            () => editorData
          );
          trackLoadEvent('init');
          entityLoads[loaderKey] = loadEntity(spaceContext, entityId).then(data => {
            editorData = data;
            recordEntityEditorLoadTime(entityType, loadStartMs);
            // Only add if data is still required once loaded:
            if ($scope.entityLoads[loaderKey]) {
              $scope.editorsData[loaderKey] = editorData;
            }
            return { editorData, trackLoadEvent };
          });
        }
      }
      entityLoads[loaderKey]
        .then(({ editorData, trackLoadEvent }) => updateSlideState(editorData, trackLoadEvent))
        .catch(error => setLoadingError(error));
      return entityLoads;
    }, {});

    // Get rid of unused editorData (e.g. because slide(s) using it were closed)
    $scope.editorsData = mapValues($scope.entityLoads, (_v, key) => $scope.editorsData[key]);

    // If there was more than one new slide added to the stack, we will have to
    // trigger loading for all those new entries, not just the one on top.
    // This happens initially and on browser history back.
    // TODO: Optimize this: Only load (and therefore re-enable Angular watchers)
    // on the newly added slides.
    if (multipleNewSlidesAdded) {
      $scope.loaded = false;
      // TODO: Find a better way to get notified when all slides' editors have been
      // fully loaded instead of giving each one 3s.
      loaderTimeoutID = scopeTimeout($scope.slideStates.length * 3000, () => {
        $scope.loaded = true;
      });
    }
  }

  function createReferenceContext(entityInfo, doc, slide, cb = () => {}) {
    const [_entryId, fieldId, localeCode, focusIndex] = slide.path;
    // The links$ property should end when the editor is closed
    const field = find(entityInfo.contentType.fields, { apiName: fieldId });
    const lifeline = K.createBus();
    const links$ = K.endWith(
      doc.valuePropertyAt(['fields', field.id, localeCode]),
      lifeline.stream
    ).map(links => links || []);

    return {
      links$,
      focusIndex,
      editorSettings: deepFreeze(cloneDeep($scope.preferences)),
      parentId: entityInfo.id,
      field,
      add: link => {
        return doc.pushValueAt(['fields', field.id, localeCode], link);
      },
      remove: index => {
        return doc.removeValueAt(['fields', field.id, localeCode, index]);
      },
      close: closeReason => {
        lifeline.end();
        goToPreviousSlideOrExit(closeReason, () => {
          // Bulk editor can't ever be the one and only slide. So e.g. returning to
          // the content list on a "<" click is a use-case we do not have to handle.
          throw new Error('Unexpected "exit" after closing bulk editor');
        });
        cb();
      }
    };
  }

  function scopeTimeout(ms, fn) {
    return setTimeout(() => {
      fn();
      $scope.$digest();
    }, ms);
  }

  function clearTimeouts() {
    [
      loaderTimeoutID,
      peekOutTimeoutID,
      peekInTimeoutID,
      clearPeekTimeoutID,
      clearPreviousPeekTimeoutID
    ].forEach(clearTimeout);
  }
};

function isRelevantState({ name }) {
  return /^spaces\.detail(\.environment|)\.(entries|assets)\.detail$/.test(name);
}

const ENTITY_EDITOR_HTTP_TIME_EVENTS = {
  Entry: 'entry_editor_http_time',
  Asset: 'asset_editor_http_time'
};

function recordEntityEditorLoadTime(entityType, loadStartMs) {
  const loadTimeMs = Date.now() - loadStartMs;
  Telemetry.record(ENTITY_EDITOR_HTTP_TIME_EVENTS[entityType], loadTimeMs);
}
