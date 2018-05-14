import {
  getSlideInEntities,
  goToSlideInEntity
} from 'states/EntityNavigationHelpers';

import { onFeatureFlag } from 'utils/LaunchDarkly';

const SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG =
  'feature-at-05-2018-sliding-entry-editor-multi-level';
const PEEK_IN_DELAY = 500;
const PEEK_OUT_DELAY = 500;
const OFFSET_CLASSNAME = 'workbench-layer--offset';

function setEntities ($scope) {
  $scope.entities = getSlideInEntities();
}

export default ($scope, _$state) => {
  $scope.context.ready = true;
  let peekLayer;
  let peekInTimeoutReference;
  let peekOutTimeoutReference;

  onFeatureFlag($scope, SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG, isEnabled => {
    $scope.isSlideinEntryEditorEnabled = isEnabled;
  });

  setEntities($scope);

  const loaderTemoutReference = window.setTimeout(() => {
    // TODO: We have to unset this when navigating back via browser history.
    // E.g. watch $scope.entities and do another timeout.
    $scope.loaded = true;
    $scope.$digest();
  }, $scope.entities.length * 3000);

  $scope.topPeekingLayerIndex = -1;

  $scope.isTopLayer = (index) => (index + 1) === $scope.entities.length;
  $scope.isLayerPeekedUpon = (index) => index === peekLayer;

  $scope.close = (entity) => {
    peekLayer = null;
    goToSlideInEntity(entity, $scope.isSlideinEntryEditorEnabled);
  };

  $scope.initPeeking = (index) => {
    const length = $scope.entities.length;
    const previous = index - 1;

    if (index === length - 1) {
      $scope.topPeekingLayerIndex = previous;

      peekOutTimeoutReference = window.setTimeout(() => {
        getCurrentLayers().forEach((item) => {
          item.classList.remove(OFFSET_CLASSNAME);
        });
      }, PEEK_OUT_DELAY);
    }
  };

  $scope.peekIn = (index) => {
    const length = $scope.entities.length;
    const next = index + 1;

    if ($scope.topPeekingLayerIndex >= index) {
      peekLayer = index;
    }

    window.clearTimeout(peekOutTimeoutReference);
    peekInTimeoutReference = window.setTimeout(() => {
      getCurrentLayers().forEach((item) => {
        item.classList.remove(OFFSET_CLASSNAME);
      });

      if ($scope.topPeekingLayerIndex >= index) {
        getCurrentLayers().slice(next, length).forEach((item) => {
          item.classList.add(OFFSET_CLASSNAME);
        });
      }
    }, PEEK_IN_DELAY);
  };

  $scope.peekOut = () => {
    peekLayer = null;
    window.clearTimeout(peekInTimeoutReference);
  };

  const unlistenStateChangeSuccess = $scope.$on(
    '$locationChangeSuccess', () => setEntities($scope)
  );

  $scope.$on('$destroy', () => {
    unlistenStateChangeSuccess();
    window.clearTimeout(loaderTemoutReference);
    window.clearTimeout(peekOutTimeoutReference);
    window.clearTimeout(peekInTimeoutReference);
  });
};

function getCurrentLayers () {
  return Array.from(document.querySelectorAll('.workbench-layer'));
}
