import {h} from 'ui/Framework';

export default function ($scope) {
  $scope.component = h('noscript');
  const {properties} = $scope;

  let state = {orgId: '', spaces: []};

  rerender({orgId: properties.orgId, spaces: loadSpaces(properties.orgId)});

  function rerender (nextState) {
    $scope.properties.context.ready = true;
    state = nextState;
    $scope.component = render(state);
    $scope.$applyAsync();
  }
}

function loadSpaces () {
  return Array(4).fill({
    name: 'MarketingWebsite',
    planShortName: 'XL'
  });
}

function render ({spaces, orgId}) {
  return h('.workbench', [
    h('.workbench-header__wrapper', [
      h('header.workbench-header', [
        h('.workbench-header__icon', [/* TODO missing icon */]),
        h('h1.workbench-header__title', ['Spaces'])
      ])
    ]),
    h('.workbench-main', [
      h('.workbench-main__content', {
      }, [renderSpaces(spaces)]),
      h('.workbench-main__sidebar', [renderRightSidebar(orgId)])
    ])
  ]);
}

function renderSpaces (spaces) {
  return h('ul', spaces.map(({name}) => h('li', [name])));
}

function renderRightSidebar (orgId) {
  return h('p', [`Add space to org ${orgId}`]);
}
