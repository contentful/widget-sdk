import { useReducer } from 'react';
import { createImmerReducer } from 'redux/utils/createImmerReducer.es6';
import createResourceService from 'services/ResourceService.es6';
import * as accessChecker from 'access_control/AccessChecker';
import * as LD from 'utils/LaunchDarkly/index.es6';
import { getOrgFeature, getSpaceFeature } from 'data/CMA/ProductCatalog.es6';
import { canCreate } from 'utils/ResourceUtils.es6';
import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService.es6';
import * as SpaceEnvironmentsRepo from 'data/CMA/SpaceEnvironmentsRepo.es6';
import { openCreateEnvDialog } from '../CreateEnvDialog';
import { openDeleteEnvironmentDialog } from '../DeleteDialog.es6';
import { ENVIRONMENTS_FLAG } from 'featureFlags.es6';

/**
 * Actions
 */

const SET_PERMISSIONS = 'SET_PERMISSIONS';
const SET_ENVIRONMENTS = 'SET_ENVIRONMENTS';
const SET_IS_LOADING = 'SET_IS_LOADING';

/**
 * Reducer
 */

export const createEnvReducer = createImmerReducer({
  [SET_PERMISSIONS]: (state, { canSelectSource, aliasesEnabled, canManageAliases }) => {
    state.canSelectSource = canSelectSource;
    state.aliasesEnabled = aliasesEnabled;
    state.canManageAliases = canManageAliases;
  },
  [SET_ENVIRONMENTS]: (
    state,
    { resource, items, canCreateEnv, allSpaceAliases, hasOptedInEnv }
  ) => {
    state.resource = resource;
    state.items = items;
    state.canCreateEnv = canCreateEnv;
    state.allSpaceAliases = allSpaceAliases;
    state.hasOptedInEnv = hasOptedInEnv;
  },
  [SET_IS_LOADING]: (state, { value }) => {
    state.isLoading = value;
  }
});

export const useEnvironmentsRouteState = props => {
  const initialState = {
    isLoading: true,
    canCreateEnv: false,
    aliasesEnabled: false,
    canSelectSource: false,
    canManageAliases: false,
    hasOptedInEnv: false,
    items: [],
    resource: { usage: 0 },
    canUpgradeSpace: props.canUpgradeSpace,
    isLegacyOrganization: props.isLegacyOrganization,
    organizationId: props.organizationId,
    spaceId: props.spaceId
  };

  const [state, dispatch] = useReducer(createEnvReducer, initialState);

  const { endpoint, spaceId } = props;

  const resourceEndpoint = SpaceEnvironmentsRepo.create(endpoint);
  const resourceService = createResourceService(spaceId, 'space');

  const FetchPermissions = async () => {
    const { spaceId, organizationId, goToSpaceDetail } = props;

    const hasAccess = accessChecker.can('manage', 'Environments');
    if (!hasAccess) goToSpaceDetail();

    const [environmentsEnabled, canSelectSource, aliasesEnabled] = await Promise.all([
      LD.getCurrentVariation(ENVIRONMENTS_FLAG),
      getOrgFeature(organizationId, 'environment_branching'),
      getSpaceFeature(spaceId, 'environment_aliasing')
    ]);

    if (!environmentsEnabled) goToSpaceDetail();

    const canManageAliases = accessChecker.can('manage', 'EnvironmentAliases');
    dispatch({
      type: SET_PERMISSIONS,
      canSelectSource,
      canManageAliases,
      aliasesEnabled
    });
  };

  const makeEnvironmentModel = environment => {
    const { isMasterEnvironment, getAliasesIds } = props;
    const statusId = environment.sys.status.sys.id;
    return {
      id: environment.sys.id,
      isMaster: isMasterEnvironment(environment),
      aliases: getAliasesIds(environment),
      status: statusId.match(/ready|failed/) ? statusId : 'inProgress',
      payload: environment
    };
  };

  const FetchEnvironments = async () => {
    const { isLegacyOrganization } = props;
    dispatch({ type: SET_IS_LOADING, value: true });

    const { environments, aliases } = await resourceEndpoint.getAll();

    const items = environments.map(makeEnvironmentModel);

    const resource = isLegacyOrganization
      ? { usage: items.length && items.length - 1 } // exclude master for consistency with v2 api
      : await resourceService.get('environment');

    dispatch({
      type: SET_ENVIRONMENTS,
      resource,
      items,
      canCreateEnv: isLegacyOrganization || canCreate(resource),
      hasOptedInEnv: !!aliases,
      allSpaceAliases: aliases
    });
    dispatch({ type: SET_IS_LOADING, value: false });
  };

  const OpenCreateDialog = async () => {
    const { currentEnvironmentId } = props;
    const { items, canSelectSource } = state;

    const created = await openCreateEnvDialog(
      resourceEndpoint.create,
      items,
      currentEnvironmentId,
      // Do not show env picker if there is only a single source environment
      canSelectSource && items.length > 1
    );

    if (created) {
      await FetchEnvironments();
    }
  };

  const OpenDeleteDialog = async environment => {
    const { currentEnvironmentId } = props;

    const deleted = await openDeleteEnvironmentDialog(
      resourceEndpoint.remove,
      environment.id,
      currentEnvironmentId
    );

    if (deleted) {
      await FetchEnvironments();
    }
  };

  const OpenUpgradeSpaceDialog = () => {
    const { organizationId, getSpaceData } = props;

    showUpgradeSpaceDialog({
      organizationId,
      space: getSpaceData(),
      action: 'change',
      scope: 'space',
      onSubmit: () => FetchEnvironments()
    });
  };

  const actions = {
    FetchPermissions,
    FetchEnvironments,
    OpenCreateDialog,
    OpenDeleteDialog,
    OpenUpgradeSpaceDialog
  };

  return [state, actions];
};
