import { assign } from 'utils/Collections';
import { match, makeCtor } from 'utils/TaggedValues';
import { caseofEq, otherwise } from 'sum-types';
import * as C from 'utils/Concurrent';
import { bindActions, createStore, makeReducer } from 'ui/Framework/Store';
import * as LD from 'utils/LaunchDarkly';

import * as accessChecker from 'access_control/AccessChecker';
import createResourceService from 'services/ResourceService';
import { isLegacyOrganization, canCreate } from 'utils/ResourceUtils';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import $state from '$state';
import $q from '$q';

import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo';
import { openCreateDialog, openEditDialog } from './EditDialog';
import { openDeleteDialog } from './DeleteDialog';
import render from './View';

export default {
  name: 'environments',
  url: '/environments',
  template: '<cf-component-store-bridge ng-if="environmentComponent" component="environmentComponent" />',
  controller: ['$scope', 'spaceContext', ($scope, spaceContext) => {
    const hasAccess = accessChecker.can('update', 'settings');
    if (!hasAccess) {
      $state.go('spaces.detail');
    }

    LD.getCurrentVariation('feature-dv-11-2017-environments')
      .then((environmentsEnabled) => {
        if (environmentsEnabled) {
          $scope.environmentComponent = createComponent(spaceContext);
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
  [Reload]: (state, _, { resourceEndpoint, resourceService, dispatch }) => {
    C.runTask(function* () {
      const result = yield C.tryP($q.all([
        resourceEndpoint.getAll(),
        resourceService.get('environment')
      ]));
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
      [C.Success]: ([items, resource]) => {
        return assign(state, {
          items: items.map(makeEnvironmentModel),
          // Note: we don't show limits for v1 orgs.
          // There is a hardcoded limit of 100 environments for v1 orgs on the
          // backend, but we don't enforce it on frontend as it should not be hit
          // under normal circumstances.
          usage: resource.usage,
          limit: resource.limits.maximum,
          canCreateEnv: canCreate(resource),
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
  const resourceService = createResourceService(spaceContext.getId(), 'space');
  const context = {
    resourceEndpoint,
    resourceService
  };

  const organization = spaceContext.organizationContext.organization;
  const initialState = {
    items: [],
    canCreateEnv: true,
    canUpgradeSpace: isOwnerOrAdmin(organization),
    isLegacyOrganization: isLegacyOrganization(organization),
    organizationId: organization.sys.id
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
