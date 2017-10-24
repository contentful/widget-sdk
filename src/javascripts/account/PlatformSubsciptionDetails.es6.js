import {h} from 'ui/Framework';
import {runTask} from 'utils/Concurrent';

export default function ($scope) {
  $scope.component = h('noscript');
  const {properties} = $scope;

  let state = {orgId: ''};

  runTask(function* () {
    const nextState = yield loadStateFromProperties(properties);
    rerender(nextState);
  });

  function rerender (nextState) {
    $scope.properties.context.ready = true;
    state = nextState;
    $scope.component = render(state);
    $scope.$applyAsync();
  }
}

// TODO: load data here
function loadStateFromProperties ({orgId}) {
  return Promise.resolve({orgId});
}

function render ({orgId}) {
  return h('.workbench', [
    header(),
    h('.workbench-main', [
      h('.workbench-main__content', {
        style: { padding: '20px 25px' }
      }, [h('pre', [orgId])])
    ])
  ]);
}

function header () {
  return h('.workbench-header__wrapper', [
    h('header.workbench-header', [
      h('h1.workbench-header__title', ['Platform subscription'])
    ])
  ]);
}
