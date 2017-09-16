import {h} from 'ui/Framework';
import {createStore, makeReducer} from 'ui/Framework/Store';

export default function ({$scope}) {
  $scope.savedViewsComponent = {
    render: () => h('div'),
    store: createStore({}, makeReducer({})),
    actions: {}
  };
}
