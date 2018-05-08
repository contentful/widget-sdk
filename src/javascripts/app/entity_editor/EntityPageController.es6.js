import {
  getSlideInEntities,
  goToSlideInEntity
} from 'states/EntityNavigationHelpers';

import { onFeatureFlag } from 'utils/LaunchDarkly';

const SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG =
  'feature-at-05-2018-sliding-entry-editor-multi-level';

function setEntities ($scope) {
  $scope.entities = getSlideInEntities();
}

export default ($scope, _$state) => {
  $scope.context.ready = true;

  onFeatureFlag($scope, SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG, isEnabled => {
    $scope.isSlideinEntryEditorEnabled = isEnabled;
  });

  $scope.topPeekingLayerIndex = -1;

  $scope.close = entity => {
    goToSlideInEntity(entity, $scope.isSlideinEntryEditorEnabled);
    $scope.testingArray = [];
  };

  $scope.initPeeking = (index) => {
    const length = $scope.entities.length;
    const previous = index - 1;

    if (index === length - 1) {
      $scope.topPeekingLayerIndex = previous;
    }
  };

  $scope.peekIn = (index) => {
    const length = $scope.entities.length;
    const arr = [].slice.apply(document.querySelectorAll('.workbench-layer'));
    const next = index + 1;

    if ($scope.topPeekingLayerIndex >= index) {
      arr.slice(next, length).map((item) => {
        item.classList.add('workbench-layer--peeked');
      });
    }
  };

  $scope.peekOut = (index) => {
    const length = $scope.entities.length;
    const arr = [].slice.apply(document.querySelectorAll('.workbench-layer'));

    arr.slice(index, length).map((item) => {
      item.classList.remove('workbench-layer--peeked');
    });
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
