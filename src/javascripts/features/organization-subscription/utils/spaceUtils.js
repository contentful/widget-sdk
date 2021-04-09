import _ from 'lodash';

import { beginSpaceCreation } from 'services/CreateSpace';
import { beginSpaceChange, getNotificationMessage } from 'services/ChangeSpaceService';
import { openDeleteSpaceDialog } from 'features/space-settings';
import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { Notification } from '@contentful/forma-36-react-components';

export const createSpace = (organizationId) => {
  return () => {
    trackCTAClick(CTA_EVENTS.CREATE_SPACE, { organizationId });

    beginSpaceCreation(organizationId);
  };
};

export const deleteSpace = (spacePlans, onSpacePlansChange) => {
  return (space, plan) => {
    return () => {
      openDeleteSpaceDialog({
        space,
        plan,
        onSuccess: () => {
          const newSpacePlans = spacePlans.filter((plan) => {
            return plan.space && plan.space.sys.id !== space.sys.id;
          });

          onSpacePlansChange(newSpacePlans);
        },
      });
    };
  };
};

export const changeSpace = (organizationId, spacePlans, onSpacePlansChange, setChangedSpaceId) => {
  return (space) => {
    return () => {
      trackCTAClick(CTA_EVENTS.UPGRADE_SPACE_PLAN, { organizationId, spaceId: space.sys.id });

      beginSpaceChange({
        organizationId,
        space,
        onSubmit: async (productRatePlan) => {
          // Update current spacePlan for this space with new data
          const currentSpacePlan = _.cloneDeep(
            spacePlans.find((sp) => sp.space.sys.id === space.sys.id)
          );

          const newSpacePlans = spacePlans.map((spacePlan) => {
            if (spacePlan.space.sys.id !== space.sys.id) {
              return spacePlan;
            }

            spacePlan.price = productRatePlan.price;
            spacePlan.name = productRatePlan.name;

            return spacePlan;
          });

          const newSpacePlan = spacePlans.find((sp) => sp.space.sys.id === space.sys.id);

          onSpacePlansChange(newSpacePlans);
          setChangedSpaceId(space.sys.id);

          Notification.success(getNotificationMessage(space, currentSpacePlan, newSpacePlan));
        },
      });
    };
  };
};
