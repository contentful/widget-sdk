import {h} from 'ui/Framework';

export default function ($scope) {
  $scope.component = h('noscript');
  const {properties} = $scope;

  let state = {};

  rerender({orgId: properties.orgId});

  function rerender (nextState) {
    $scope.properties.context.ready = true;
    state = nextState;
    $scope.component = render(state);
    $scope.$applyAsync();
  }
}

function render ({orgId}) {
  return h('h2', [`List of spaces for ${orgId} - coming soon`]);
}
