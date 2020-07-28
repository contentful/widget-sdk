import { useReducer } from 'react';
import { createImmerReducer } from 'core/utils/createImmerReducer';
import createResourceService from 'services/ResourceService';
import * as accessChecker from 'access_control/AccessChecker';
import { getVariation } from 'LaunchDarkly';
import { getOrgFeature, getSpaceFeature } from 'data/CMA/ProductCatalog';
import { canCreate } from 'utils/ResourceUtils';
import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService';
import * as SpaceEnvironmentsRepo from 'data/CMA/SpaceEnvironmentsRepo';
import { openCreateEnvDialog } from '../CreateEnvDialog';
import { openDeleteEnvironmentDialog } from '../DeleteDialog';
import { ENVIRONMENTS_FLAG, PRICING_2020_RELEASED } from 'featureFlags';
import * as PricingService from 'services/PricingService';

/**
 * Actions
 */

const SET_PERMISSIONS = 'SET_PERMISSIONS';
const SET_ENVIRONMENTS = 'SET_ENVIRONMENTS';
const SET_IS_LOADING = 'SET_IS_LOADING';
const SET_HAS_NEXT_SPACE_PLAN = 'SET_HAS_NEXT_SPACE_PLAN';

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
  },
  [SET_HAS_NEXT_SPACE_PLAN]: (state, { hasNextSpacePlan }) => {
    state.hasNextSpacePlan = hasNextSpacePlan;
  },
});

export const useEnvironmentsRouteState = (props) => {
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
    spaceId: props.spaceId,
    hasNextSpacePlan: undefined,
    pubsubClient: props.pubsubClient,
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
      getVariation(ENVIRONMENTS_FLAG, { spaceId, organizationId }),
      getOrgFeature(organizationId, 'environment_branching'),
      getSpaceFeature(spaceId, 'environment_aliasing'),
    ]);

    if (!environmentsEnabled) goToSpaceDetail();

    const canManageAliases = accessChecker.can('manage', 'EnvironmentAliases');
    dispatch({
      type: SET_PERMISSIONS,
      canSelectSource,
      canManageAliases,
      aliasesEnabled,
    });
  };

  const makeEnvironmentModel = (environment) => {
    const { isMasterEnvironment, getAliasesIds } = props;
    const statusId = environment.sys.status.sys.id;
    return {
      id: environment.sys.id,
      isMaster: isMasterEnvironment(environment),
      aliases: getAliasesIds(environment),
      status: statusId.match(/ready|failed/) ? statusId : 'inProgress',
      payload: environment,
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
      allSpaceAliases: aliases,
    });
    dispatch({ type: SET_IS_LOADING, value: false });
  };

  const RefetchEnvironments = async () => {
    const { isLegacyOrganization } = props;

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
      allSpaceAliases: aliases,
    });
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

  const OpenDeleteDialog = async (environment) => {
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
      onSubmit: () => FetchEnvironments(),
    });
  };

  const FetchNextSpacePlan = async () => {
    const { organizationId, spaceId, canUpgradeSpace } = props;
    const isNewPricingReleased = await getVariation(PRICING_2020_RELEASED, {
      organizationId,
    });

    if (canUpgradeSpace && isNewPricingReleased) {
      const nextSpacePlan = await PricingService.nextSpacePlanForResource(
        organizationId,
        spaceId,
        PricingService.SPACE_PLAN_RESOURCE_TYPES.ENVIRONMENT
      );

      dispatch({ type: SET_HAS_NEXT_SPACE_PLAN, hasNextSpacePlan: !!nextSpacePlan });
    }
  };

  const actions = {
    FetchPermissions,
    FetchEnvironments,
    FetchNextSpacePlan,
    RefetchEnvironments,
    OpenCreateDialog,
    OpenDeleteDialog,
    OpenUpgradeSpaceDialog,
  };

  return [state, actions];
};
