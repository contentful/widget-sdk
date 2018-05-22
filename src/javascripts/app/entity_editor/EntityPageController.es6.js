import {
  getSlideInEntities,
  goToSlideInEntity
} from 'states/EntityNavigationHelpers';

import { onFeatureFlag } from 'utils/LaunchDarkly';

const { setTimeout, clearTimeout } = window;

const SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG =
  'feature-at-05-2018-sliding-entry-editor-multi-level';
const PEEK_IN_DELAY = 500;
const PEEK_OUT_DELAY = 500;
const PEEK_ANIMATION_DURATION = 200;

export default ($scope, _$state) => {
  let topPeekingLayerIndex = -1;
  let peekedLayerIndexes = [];
  let hoveredLayerIndex;
  let peekInTimeoutID, peekOutTimeoutID;
  let clearPreviousPeekTimeoutID, clearPeekTimeoutID;
  let loaderTimeoutID;

  $scope.entities = [];
  $scope.context.ready = true;

  onFeatureFlag($scope, SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG, isEnabled => {
    $scope.isSlideinEntryEditorEnabled = isEnabled;
  });

  setEntities($scope);

  const isTopLayer = $scope.isTopLayer =
    (index) => (index + 1) === $scope.entities.length;

  $scope.getLayerClasses = (index) => {
    const currentlyPeekedLayerIndex = peekedLayerIndexes.slice(-1)[0];
    const optimize = $scope.entities.length > 4;
    return {
      [`workbench-layer--${index}:`]: true,
      'workbench-layer--is-current': isTopLayer(index),
      'workbench-layer--hovered': index === hoveredLayerIndex,
      'workbench-layer--peeked': peekedLayerIndexes.includes(index),
      'workbench-layer--offset': index > currentlyPeekedLayerIndex,
      'workbench-layer--optimized': optimize
    };
  };

  $scope.close = (entity) => {
    clearTimeouts();
    hoveredLayerIndex = null;
    topPeekingLayerIndex = -1;
    peekedLayerIndexes = [];
    goToSlideInEntity(entity, $scope.isSlideinEntryEditorEnabled);
  };

  $scope.initPeeking = (index) => {
    if (isTopLayer(index)) {
      topPeekingLayerIndex = index - 1;

      peekOutTimeoutID = scopeTimeout(PEEK_OUT_DELAY, () => {
        clearPeekTimeoutID = scopeTimeout(PEEK_ANIMATION_DURATION,
          () => { peekedLayerIndexes = []; }
        );
        peekedLayerIndexes.push(undefined);
      });
    }
  };

  $scope.peekIn = (index) => {
    const isPeekable = index <= topPeekingLayerIndex;

    if (isPeekable) {
      hoveredLayerIndex = index;
    }
    clearTimeout(peekOutTimeoutID);
    peekInTimeoutID = scopeTimeout(PEEK_IN_DELAY, () => {
      clearPreviousPeekTimeoutID = scopeTimeout(PEEK_ANIMATION_DURATION,
        () => { peekedLayerIndexes = isPeekable ? [index] : []; }
      );
      if (isPeekable) {
        peekedLayerIndexes.push(index);
      }
    });
  };

  $scope.peekOut = () => {
    hoveredLayerIndex = null;
    clearTimeout(peekInTimeoutID);
    clearTimeout(clearPreviousPeekTimeoutID);
  };

  const unlistenStateChangeSuccess = $scope.$on(
    '$locationChangeSuccess', () => setEntities($scope)
  );

  $scope.$on('$destroy', () => {
    unlistenStateChangeSuccess();
    clearTimeouts();
  });

  function setEntities ($scope) {
    const previousEntities = $scope.entities;
    const moreThanOneNewEntityAdded =
      previousEntities.length + 1 < $scope.entities.length;

    $scope.entities = getSlideInEntities();

    // If there was more than one new entity added to the stack, we will have to
    // trigger loading for all those new entries, not just the one on top.
    // This happens initially and on browser history back.
    // TODO: Optimize this: Only load (and therefore re-enable Angular watchers)
    // on the newly added slides.
    if (moreThanOneNewEntityAdded) {
      $scope.loaded = false;
      // TODO: Find a better way to get notified when all entity editors have been
      // fully loaded instead of giving each one 3s.
      loaderTimeoutID = scopeTimeout($scope.entities.length * 3000,
        () => { $scope.loaded = true; }
      );
    }
  }

  function scopeTimeout (ms, fn) {
    return setTimeout(() => {
      fn();
      $scope.$digest();
    }, ms);
  }

  function clearTimeouts () {
    [
      loaderTimeoutID,
      peekOutTimeoutID,
      peekInTimeoutID,
      clearPeekTimeoutID,
      clearPreviousPeekTimeoutID
    ].forEach(clearTimeout);
  }
};
