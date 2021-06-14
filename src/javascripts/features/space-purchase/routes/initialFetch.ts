import { createOrganizationEndpoint, createSpaceEndpoint } from 'data/EndpointFactory';
import { FLAGS, getVariation } from 'LaunchDarkly';
import {
  getAddOnProductRatePlans,
  getBasePlan,
  getSpacePlanForSpace,
  getSpacePlans,
  getSpaceProductRatePlans,
} from '../../pricing-entities';
import {
  getPlansWithSpaces,
  isFreePlan,
  isSelfServicePlan,
} from 'account/pricing/PricingDataProvider';
import { PLATFORM_CONTENT } from '../utils/platformContent';
import { getSpace } from 'access_control/OrganizationMembershipRepository';
import { actions } from '../context';
import * as TokenStore from 'services/TokenStore';
import { getOrganizationMembership, isOwnerOrAdmin } from 'services/OrganizationRoles';
import createResourceService from 'services/ResourceService';
import { FREE_SPACE_IDENTIFIER } from 'app/SpaceWizards/shared/utils';
import { getTemplatesList } from 'services/SpaceTemplateLoader';
import {
  fetchPlatformPurchaseContent,
  fetchSpacePurchaseContent,
} from '../services/fetchSpacePurchaseContent';
import { transformSpaceRatePlans } from '../utils/transformSpaceRatePlans';
import { alnum } from 'utils/Random';
import { EVENTS, trackEvent } from '../utils/analyticsTracking';
import { resourceIncludedLimitReached } from 'utils/ResourceUtils';
import { FreeSpaceResource } from '../types';
import { router } from 'core/react-routing';

const CREATE_SPACE_SESSION = 'create_space';
const UPGRADE_SPACE_SESSION = 'upgrade_space';

export const initialFetch =
  (organizationId, spaceId, from, preselectApps, dispatch) => async () => {
    const endpoint = createOrganizationEndpoint(organizationId);
    const spaceEndpoint = createSpaceEndpoint(spaceId);

    const isAppPurchasingEnabled = await getVariation(FLAGS.COMPOSE_LAUNCH_PURCHASE, {
      organizationId,
    });

    let hasPurchasedComposeLaunch;
    let composeAndLaunchProductRatePlan;

    if (isAppPurchasingEnabled) {
      const [addOnProductRatePlans, plans] = await Promise.all([
        getAddOnProductRatePlans(endpoint),
        getPlansWithSpaces(endpoint),
      ]);

      // TODO(jo-sm): We should be smarter about this, using `find`, once the `internalName` is finalized.
      composeAndLaunchProductRatePlan = addOnProductRatePlans[0];

      hasPurchasedComposeLaunch = !!plans.items.find((plan) => {
        return plan.productRatePlanId === composeAndLaunchProductRatePlan.sys.id;
      });
    }

    let selectedPlatform;

    if (preselectApps && !hasPurchasedComposeLaunch) {
      selectedPlatform = {
        ...PLATFORM_CONTENT.COMPOSE_AND_LAUNCH,
        price: composeAndLaunchProductRatePlan?.price,
      };
    }

    // Only should be purchasing apps if purchasing of apps is enabled and they haven't purchased compose+launch yet.
    const purchasingApps = isAppPurchasingEnabled && !hasPurchasedComposeLaunch;

    // Dispatch currentSpace early so we can define if the user is creating or changing a space
    if (spaceId) {
      const currentSpace = await getSpace(spaceEndpoint);

      dispatch({ type: actions.SET_CURRENT_SPACE, payload: currentSpace });
    }

    const [
      organization,
      organizationMembership,
      basePlan,
      currentSpaceRatePlan,
      rawSpaceRatePlans,
      subscriptionPlans,
      freeSpaceResource,
      templatesList,
      pageContent,
    ] = await Promise.all([
      TokenStore.getOrganization(organizationId),
      getOrganizationMembership(organizationId),
      getBasePlan(endpoint),
      spaceId ? getSpacePlanForSpace(endpoint, spaceId) : undefined,
      getSpaceProductRatePlans(endpoint, spaceId),
      getSpacePlans(endpoint),
      createResourceService(endpoint).get(FREE_SPACE_IDENTIFIER) as Promise<FreeSpaceResource>,
      getTemplatesList(),
      purchasingApps ? fetchPlatformPurchaseContent() : fetchSpacePurchaseContent(),
    ]);

    const canAccess =
      isOwnerOrAdmin(organization) && (isSelfServicePlan(basePlan) || isFreePlan(basePlan));

    if (!canAccess) {
      router.navigate({ path: 'organizations.subscription.overview', orgId: organizationId });

      return;
    }

    const spaceRatePlans = transformSpaceRatePlans(rawSpaceRatePlans, freeSpaceResource);

    const sessionId = alnum(16);

    dispatch({
      type: actions.SET_INITIAL_STATE,
      payload: {
        organization,
        currentSpaceRatePlan,
        sessionId,
        templatesList,
        spaceRatePlans,
        subscriptionPlans,
        freeSpaceResource,
        pageContent,
        selectedPlatform,
        composeAndLaunchProductRatePlan,
      },
    });

    // TODO: Once trials is further along, add logic to verify if user is in trial or not.
    // Now that all the data has been loaded (and dispatched), we can track the "begin" event
    trackEvent(
      EVENTS.BEGIN,
      {
        organizationId,
        spaceId,
        sessionId,
      },
      {
        userOrganizationRole: organizationMembership.role,
        organizationPlatform: basePlan.customerType,
        canCreateFreeSpace: !resourceIncludedLimitReached(freeSpaceResource),
        sessionType: spaceId ? UPGRADE_SPACE_SESSION : CREATE_SPACE_SESSION,
        currentSpacePlan: currentSpaceRatePlan,
        canPurchaseApps: isAppPurchasingEnabled ? !hasPurchasedComposeLaunch : undefined,
        from,
        performancePackagePreselected: !!selectedPlatform,
      }
    );

    // TODO: move the requests related to activeAppTrial and purchasings to the step that is using them
    return {
      purchasingApps,
    };
  };
