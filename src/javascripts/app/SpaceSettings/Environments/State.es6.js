import { assign } from 'utils/Collections.es6';
import { match, makeCtor } from 'utils/TaggedValues.es6';
import { caseofEq, otherwise } from 'sum-types';
import * as C from 'utils/Concurrent.es6';
import { bindActions, createStore, makeReducer } from 'ui/Framework/Store.es6';
import * as LD from 'utils/LaunchDarkly';

import * as accessChecker from 'access_control/AccessChecker';
import createResourceService from 'services/ResourceService.es6';
import { isLegacyOrganization, canCreate } from 'utils/ResourceUtils.es6';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import $state from '$state';
import $q from '$q';

import * as SpaceEnvironmentRepo from 'data/CMA/SpaceEnvironmentsRepo.es6';
import { openCreateDialog, openEditDialog } from './EditDialog.es6';
import { openDeleteDialog } from './DeleteDialog.es6';
import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService.es6';
import render from './View.es6';

const environmentsFlagName = 'feature-dv-11-2017-environments';
const incentivizeFlagName = 'feature-bv-06-2018-incentivize-upgrade';

export default {
  name: 'environments',
  url: '/environments',
  template:
    '<cf-component-store-bridge ng-if="environmentComponent" component="environmentComponent" />',
  controller: [
    '$scope',
    'spaceContext',
    ($scope, spaceContext) => {
      const hasAccess = accessChecker.can('manage', 'Environments');

      if (!hasAccess) {
        $state.go('spaces.detail');
      }

      $q.all([
        LD.getCurrentVariation(environmentsFlagName),
        LD.getCurrentVariation(incentivizeFlagName)
      ]).then(([environmentsEnabled, incentivizeUpgradeEnabled]) => {
        if (environmentsEnabled) {
          $scope.environmentComponent = createComponent(spaceContext, incentivizeUpgradeEnabled);
        } else {
          $state.go('spaces.detail');
        }
      });
    }
  ]
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
    C.runTask(function*() {
      const result = yield C.tryP(
        $q.all([resourceEndpoint.getAll(), resourceService.get('environment')])
      );
      dispatch(ReceiveResponse, result);
    });
    return assign(state, { isLoading: true });
  },
  [OpenCreateDialog]: (state, _, { resourceEndpoint, dispatch }) => {
    C.runTask(function*() {
      const created = yield openCreateDialog(resourceEndpoint.create);
      if (created) {
        dispatch(Reload);
      }
    });
    return state;
  },
  [OpenEditDialog]: (state, environment, { resourceEndpoint, dispatch }) => {
    C.runTask(function*() {
      const updated = yield openEditDialog(resourceEndpoint.update, environment.payload);
      if (updated) {
        dispatch(Reload);
      }
    });
    return state;
  },
  [OpenDeleteDialog]: (state, environment, { resourceEndpoint, dispatch }) => {
    C.runTask(function*() {
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
      action: 'change',
      scope: 'space',
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
          resource = { usage: items.length && items.length - 1 }; // exclude master for consistency with v2 api
        }

        return assign(state, {
          items: items.map(makeEnvironmentModel),
          resource,
          canCreateEnv: state.isLegacyOrganization || canCreate(resource),
          isLoading: false
        });
      },
      [C.Failure]: () => assign(state, { loadingError: true })
    });
  }
});

// This is exported for testing purposes.
export function createComponent(spaceContext, incentivizeUpgradeEnabled) {
  const resourceEndpoint = SpaceEnvironmentRepo.create(spaceContext.endpoint, spaceContext.getId());
  const resourceService = createResourceService(spaceContext.getId(), 'space');
  const context = {
    resourceEndpoint,
    resourceService
  };

  const organization = spaceContext.organization;
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

  const store = createStore(initialState, (action, state) => reduce(action, state, context));

  context.dispatch = store.dispatch;

  const actions = bindActions(store, {
    OpenCreateDialog,
    OpenEditDialog,
    OpenDeleteDialog,
    OpenUpgradeSpaceDialog
  });

  store.dispatch(Reload);

  return {
    store,
    render: state => render(state, actions)
  };
}

function makeEnvironmentModel(environment) {
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
