import { assign } from 'utils/Collections';
import { match, makeCtor } from 'utils/TaggedValues';
import { caseofEq, otherwise } from 'libs/sum-types';
import * as C from 'utils/Concurrent';
import { bindActions, createStore, makeReducer } from 'ui/Framework/Store';
import * as LD from 'utils/LaunchDarkly';

import * as accessChecker from 'access_control/AccessChecker';
import $state from '$state';

import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo';
import { openCreateDialog, openEditDialog } from './EditDialog';
import { openDeleteDialog } from './DeleteDialog';
import render from './View';

export default {
  name: 'environments',
  url: '/environments',
  template: '<cf-component-store-bridge ng-if="component" component="component" />',
  controller: ['$scope', 'spaceContext', function ($scope, spaceContext) {
    const hasAccess = accessChecker.can('update', 'settings');
    if (!hasAccess) {
      $state.go('spaces.detail');
    }

    LD.getCurrentVariation('feature-dv-11-2017-environments')
      .then((environmentsEnabled) => {
        if (environmentsEnabled) {
          $scope.component = createComponent(spaceContext);
        } else {
          $state.go('spaces.detail');
        }
      });
  }]
};


// Actions
const Reload = makeCtor('Reload');
const OpenCreateDialog = makeCtor('OpenCreateDialog');
const OpenEditDialog = makeCtor('OpenEditDialog');
const OpenDeleteDialog = makeCtor('OpenDeleteDialog');
const ReceiveResponse = makeCtor('ReceiveResponse');


const reduce = makeReducer({
  [Reload]: (state, _, { resourceEndpoint, dispatch }) => {
    C.runTask(function* () {
      const result = yield C.tryP(resourceEndpoint.getAll());
      dispatch(ReceiveResponse, result);
    });
    return assign(state, { isLoading: true });
  },
  [OpenCreateDialog]: (state, _, { resourceEndpoint, dispatch }) => {
    C.runTask(function* () {
      const created = yield openCreateDialog(resourceEndpoint.create);
      if (created) {
        dispatch(Reload);
      }
    });
    return state;
  },
  [OpenEditDialog]: (state, environment, { resourceEndpoint, dispatch }) => {
    C.runTask(function* () {
      const updated = yield openEditDialog(resourceEndpoint.update, environment.payload);
      if (updated) {
        dispatch(Reload);
      }
    });
    return state;
  },
  [OpenDeleteDialog]: (state, environment, { resourceEndpoint, dispatch }) => {
    C.runTask(function* () {
      const updated = yield openDeleteDialog(resourceEndpoint.remove, environment);
      if (updated) {
        dispatch(Reload);
      }
    });
    return state;
  },
  [ReceiveResponse]: (state, result) => {
    return match(result, {
      [C.Success]: (items) => {
        return assign(state, {
          items: items.map(makeEnvironmentModel),
          isLoading: false
        });
      },
      [C.Failure]: () => assign(state, {loadingError: true})
    });
  }
});


// This is exported for testing purposes.
export function createComponent (spaceContext) {
  const resourceEndpoint = SpaceEnvironmentRepo.create(spaceContext.endpoint, spaceContext.getId());
  const context = {
    resourceEndpoint
  };

  const initialState = {
    items: []
  };

  const store = createStore(
    initialState,
    (action, state) => reduce(action, state, context)
  );

  context.dispatch = store.dispatch;

  const actions = bindActions(store, {
    OpenCreateDialog, OpenEditDialog, OpenDeleteDialog
  });

  store.dispatch(Reload);

  return {
    store,
    render: (state) => render(state, actions)
  };
}


function makeEnvironmentModel (environment) {
  const status = caseofEq(environment.sys.status.sys.id, [
    ['ready', () => 'ready'],
    ['failed', () => 'failed'],
    ['queued', () => 'inProgress'],
    // TODO we should encode all possible values here.
    [otherwise, () => 'inProgress']
  ]);
  return {
    id: environment.sys.id,
    isMaster: environment.sys.id === 'master',
    status,
    payload: environment
  };
}
