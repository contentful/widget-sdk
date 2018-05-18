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
  let peekInTimeoutReference;
  let peekOutTimeoutReference;

  onFeatureFlag($scope, SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG, isEnabled => {
    $scope.isSlideinEntryEditorEnabled = isEnabled;
  });

  $scope.topPeekingLayerIndex = -1;

  $scope.close = entity => {
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
    window.clearTimeout(peekInTimeoutReference);
  };

  setEntities($scope);

  const unlistenStateChangeSuccess = $scope.$on(
    '$locationChangeSuccess', () => setEntities($scope)
  );

  $scope.$on('$destroy', () => {
    unlistenStateChangeSuccess();
    window.clearTimeout(peekOutTimeoutReference);
    window.clearTimeout(peekInTimeoutReference);
  });
};

function getCurrentLayers () {
  return Array.from(document.querySelectorAll('.workbench-layer'));
}
