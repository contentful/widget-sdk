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
import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService';
import render from './View';

const environmentsFlagName = 'feature-dv-11-2017-environments';
const incentivizeFlagName = 'feature-bv-06-2018-incentivize-upgrade';

export default {
  name: 'environments',
  url: '/environments',
  template: '<cf-component-store-bridge ng-if="environmentComponent" component="environmentComponent" />',
  controller: ['$scope', 'spaceContext', ($scope, spaceContext) => {
    const hasAccess = accessChecker.can('update', 'settings');
    if (!hasAccess) {
      $state.go('spaces.detail');
    }

    $q.all([LD.getCurrentVariation(environmentsFlagName), LD.getCurrentVariation(incentivizeFlagName)])
      .then(([environmentsEnabled, incentivizeUpgradeEnabled]) => {
        if (environmentsEnabled) {
          $scope.environmentComponent = createComponent(spaceContext, incentivizeUpgradeEnabled);
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
const OpenUpgradeSpaceDialog = makeCtor('OpenUpgradeSpaceDialog');


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
  [OpenUpgradeSpaceDialog]: (state, _, { dispatch }) => {
    showUpgradeSpaceDialog({
      organizationId: state.organizationId,
      space: state.spaceData,
      limitReached: state.resource,
      action: 'change',
      onSubmit: () => {
        dispatch(Reload);
        return Promise.resolve();
      }
    });

    return state;
  },
  [ReceiveResponse]: (state, result) => {
    return match(result, {
      [C.Success]: ([items, resource]) => {
        // Resource service gets usage on organization level for v1 orgs - see
        // https://contentful.atlassian.net/browse/MOI-144
        // This should be fixed when `feature-bv-2018-01-features-api` is turned on.
        //
        // Note: there is a hardcoded limit of 100 environments for v1 orgs on the
        // backend, but we don't enforce it on frontend as it should not be hit
        // under normal circumstances.
        if (state.isLegacyOrganization) {
          resource = { usage: items.length };
        }
        return assign(state, {
          items: items.map(makeEnvironmentModel),
          resource,
          canCreateEnv: canCreate(resource),
          isLoading: false
        });
      },
      [C.Failure]: () => assign(state, {loadingError: true})
    });
  }
});


// This is exported for testing purposes.
export function createComponent (spaceContext, incentivizeUpgradeEnabled) {
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
    resource: { usage: 0 },
    canUpgradeSpace: isOwnerOrAdmin(organization),
    isLegacyOrganization: isLegacyOrganization(organization),
    organizationId: organization.sys.id,
    spaceData: spaceContext.space.data,
    incentivizeUpgradeEnabled
  };

  const store = createStore(
    initialState,
    (action, state) => reduce(action, state, context)
  );

  context.dispatch = store.dispatch;

  const actions = bindActions(store, {
    OpenCreateDialog, OpenEditDialog, OpenDeleteDialog, OpenUpgradeSpaceDialog
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
