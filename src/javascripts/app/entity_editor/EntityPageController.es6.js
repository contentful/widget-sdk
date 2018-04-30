import $ from 'jquery';
import {
  getSlideInEntities,
  goToSlideInEntity
} from 'states/EntityNavigationHelpers';

function setEntities ($scope) {
  $scope.entities = getSlideInEntities();
}

export default ($scope, _$state) => {
  $scope.context.ready = true;

  $scope.close = (entity) => {
    goToSlideInEntity(entity);
  };

  $scope.peekIn = ($event) => {
    const $elements = $($event.currentTarget).not($('.ng-enter')).nextAll();

    $elements.map((index, element) => {
      if (element.classList.contains('.ng-enter')) return;
      const layerCalculation = element.getAttribute('data-layer-calculation');

      if (index + 1 === $elements.length) {
        element.style.transform = 'translate3d(10vw,0,0)';
      } else {
        element.style.transform = `translate3d(calc(10vw + ${layerCalculation}px),0,0)`;
      }
    });
  };

  $scope.peekOut = ($event) => {
    const $elements = $($event.currentTarget).not($('.ng-enter')).nextAll();

    $elements.map((index, element) => {
      if (element.classList.contains('.ng-enter')) return;
      const layerCalculation = element.getAttribute('data-layer-calculation');

      if (index + 1 === $elements.length) {
        element.style.transform = 'translate3d(0,0,0)';
      } else {
        element.style.transform = `translate3d(calc(${layerCalculation}px),0,0)`;
      }
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
