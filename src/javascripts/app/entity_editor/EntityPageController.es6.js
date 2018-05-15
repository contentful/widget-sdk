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

function setEntities ($scope) {
  $scope.entities = getSlideInEntities();
}

export default ($scope, _$state) => {
  let topPeekingLayerIndex = -1;
  let peekedLayerIndexes = [];
  let hoveredLayerIndex;
  let peekInTimeoutID, peekOutTimeoutID;
  let clearPreviousPeekTimeoutID, clearPeekTimeoutID;

  $scope.context.ready = true;

  onFeatureFlag($scope, SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG, isEnabled => {
    $scope.isSlideinEntryEditorEnabled = isEnabled;
  });

  setEntities($scope);

  const loaderTemoutID = scopeTimeout($scope.entities.length * 3000,
    // TODO: We have to unset this when navigating back via browser history.
    // E.g. watch $scope.entities and do another timeout.
    () => { $scope.loaded = true; }
  );

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

  function scopeTimeout (ms, fn) {
    return setTimeout(() => {
      fn();
      $scope.$digest();
    }, ms);
  }

  function clearTimeouts () {
    [
      loaderTemoutID,
      peekOutTimeoutID,
      peekInTimeoutID,
      clearPeekTimeoutID,
      clearPreviousPeekTimeoutID
    ].forEach(clearTimeout);
  }
};
