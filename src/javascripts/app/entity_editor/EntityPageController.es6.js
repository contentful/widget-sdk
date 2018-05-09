import {
  getSlideInEntities,
  goToSlideInEntity
} from 'states/EntityNavigationHelpers';

import { onFeatureFlag } from 'utils/LaunchDarkly';

const SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG =
  'feature-at-05-2018-sliding-entry-editor-multi-level';
const PEEK_IN_DELAY = 1000;
const PEEK_OUT_DELAY = 500;
const PEEKED_CLASS_NAME = 'workbench-layer--peeked';

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
      const entityLayers = [].slice.apply(document.querySelectorAll('.workbench-layer'));
      $scope.topPeekingLayerIndex = previous;

      peekOutTimeoutReference = window.setTimeout(() => {
        entityLayers.forEach((item) => {
          item.classList.remove(PEEKED_CLASS_NAME);
        });
      }, PEEK_OUT_DELAY);
    }
  };

  $scope.peekIn = (index) => {
    const entityLayers = [].slice.apply(document.querySelectorAll('.workbench-layer'));

    window.clearTimeout(peekOutTimeoutReference);
    peekInTimeoutReference = window.setTimeout(() => {
      entityLayers.forEach((item, i) => {
        const method = i > index ? 'add' : 'remove';
        item.classList[method](PEEKED_CLASS_NAME);
      });
    }, PEEK_IN_DELAY);
  };

  $scope.peekOut = () => {
    window.clearTimeout(peekInTimeoutReference);
  };

  setEntities($scope);

  const unlistenStateChangeSuccess = $scope.$on(
    '$locationChangeSuccess',
    () => {
      setEntities($scope);
    }
  );

  $scope.$on('$destroy', unlistenStateChangeSuccess);
};
