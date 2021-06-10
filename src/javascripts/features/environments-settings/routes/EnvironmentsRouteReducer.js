import * as React from 'react';
import { createImmerReducer } from 'core/utils/createImmerReducer';
import createResourceService from 'services/ResourceService';
import * as accessChecker from 'access_control/AccessChecker';
import { getVariation, FLAGS } from 'LaunchDarkly';
import { getOrgFeature, getSpaceFeature } from 'data/CMA/ProductCatalog';
import { canCreate } from 'utils/ResourceUtils';
import { beginSpaceChange } from 'services/ChangeSpaceService';
import * as SpaceEnvironmentsRepo from 'data/CMA/SpaceEnvironmentsRepo';
import * as SpaceAliasesRepo from 'data/CMA/SpaceAliasesRepo';
import { openCreateEnvDialog } from '../components/CreateEnvDialog';
import { openCreateEnvAliasDialog } from '../components/CreateEnvAliasDialog';
import { openDeleteEnvironmentDialog } from '../components/DeleteDialog';
import * as PricingService from 'services/PricingService';
import { getEnvironmentAliasesIds, isMasterEnvironment } from 'core/services/SpaceEnvContext/utils';
import { useSpaceEnvEndpoint } from 'core/hooks/useSpaceEnvEndpoint';
import { createSpaceEndpoint } from 'data/EndpointFactory';

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

const createEnvReducer = createImmerReducer({
  [SET_PERMISSIONS]: (
    state,
    { canSelectSource, aliasesEnabled, customAliasesEnabled, canManageAliases }
  ) => {
    state.canSelectSource = canSelectSource;
    state.aliasesEnabled = aliasesEnabled;
    state.customAliasesEnabled = customAliasesEnabled;
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
  const { spaceId } = props;

  const initialState = {
    isLoading: true,
    canCreateEnv: false,
    aliasesEnabled: false,
    customAliasesEnabled: false,
    canSelectSource: false,
    canManageAliases: false,
    hasOptedInEnv: false,
    items: [],
    allSpaceAliases: [],
    resource: { usage: 0 },
    canUpgradeSpace: props.canUpgradeSpace,
    organizationId: props.organizationId,
    spaceId: props.spaceId,
    hasNextSpacePlan: undefined,
    pubsubClient: props.pubsubClient,
    currentAliasId: props.currentAliasId,
  };

  const [state, dispatch] = React.useReducer(createEnvReducer, initialState);

  const endpoint = useSpaceEnvEndpoint();
  const spaceEndpoint = createSpaceEndpoint(spaceId);

  const resourceEndpoint = SpaceEnvironmentsRepo.create(endpoint);
  const aliasEndpoint = SpaceAliasesRepo.create(endpoint);
  // The 'environment' resource is a SpaceResource. The endpoint should not use the environment-scoped route.
  const resourceService = createResourceService(spaceEndpoint);

  const FetchPermissions = async () => {
    const { spaceId, organizationId, goToSpaceDetail } = props;

    const hasAccess = accessChecker.can('manage', 'Environments');
    if (!hasAccess) {
      goToSpaceDetail();
    }

    const [environmentsEnabled, canSelectSource, aliasesEnabled, customAliasesEnabled] =
      await Promise.all([
        getVariation(FLAGS.ENVIRONMENTS_FLAG, { spaceId, organizationId }),
        getOrgFeature(organizationId, 'environment_branching'),
        getSpaceFeature(spaceId, 'environment_aliasing'),
        getSpaceFeature(spaceId, 'custom_environment_aliases'),
      ]);

    if (!environmentsEnabled) {
      goToSpaceDetail();
    }

    const canManageAliases = accessChecker.can('manage', 'EnvironmentAliases');
    dispatch({
      type: SET_PERMISSIONS,
      canSelectSource,
      canManageAliases,
      aliasesEnabled,
      customAliasesEnabled,
    });
  };

  const makeEnvironmentModel = (environment) => {
    const statusId = environment.sys.status.sys.id;
    return {
      id: environment.sys.id,
      isMaster: isMasterEnvironment(environment),
      aliases: getEnvironmentAliasesIds(environment),
      status: statusId.match(/ready|failed/) ? statusId : 'inProgress',
      payload: environment,
    };
  };

  const FetchEnvironments = async () => {
    dispatch({ type: SET_IS_LOADING, value: true });

    const { environments, aliases } = await resourceEndpoint.getAll();

    const items = environments.map(makeEnvironmentModel);

    const resource = await resourceService.get('environment');

    dispatch({
      type: SET_ENVIRONMENTS,
      resource,
      items,
      canCreateEnv: canCreate(resource),
      hasOptedInEnv: aliases.length > 0,
      allSpaceAliases: aliases,
    });
    dispatch({ type: SET_IS_LOADING, value: false });
  };

  const RefetchEnvironments = async () => {
    const { environments, aliases } = await resourceEndpoint.getAll();

    const items = environments.map(makeEnvironmentModel);

    const resource = await resourceService.get('environment');

    dispatch({
      type: SET_ENVIRONMENTS,
      resource,
      items,
      canCreateEnv: canCreate(resource),
      hasOptedInEnv: !!aliases,
      allSpaceAliases: aliases,
    });
  };

  const OpenCreateDialog = async () => {
    const { environmentId } = props;
    const { items, canSelectSource } = state;

    const created = await openCreateEnvDialog(
      resourceEndpoint.create,
      items,
      environmentId,
      // Do not show env picker if there is only a single source environment
      canSelectSource && items.length > 1
    );

    if (created) {
      await FetchEnvironments();
    }
  };

  const OpenCreateAliasDialog = async () => {
    const { environmentId } = props;
    const { items } = state;

    const created = await openCreateEnvAliasDialog(aliasEndpoint.create, items, environmentId);

    if (created) {
      await FetchEnvironments();
    }
  };

  const OpenDeleteDialog = async (environment) => {
    const { environmentId } = props;

    const deleted = await openDeleteEnvironmentDialog(
      resourceEndpoint.remove,
      environment.id,
      environmentId
    );

    if (deleted) {
      await FetchEnvironments();
    }
  };

  const OpenUpgradeSpaceDialog = () => {
    const { organizationId, getSpaceData } = props;

    beginSpaceChange({
      organizationId,
      space: getSpaceData(),
      onSubmit: () => FetchEnvironments(),
    });
  };

  const FetchNextSpacePlan = async () => {
    const { organizationId, spaceId, canUpgradeSpace } = props;

    if (canUpgradeSpace) {
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
    OpenCreateAliasDialog,
    OpenDeleteDialog,
    OpenUpgradeSpaceDialog,
  };

  return [state, actions];
};
