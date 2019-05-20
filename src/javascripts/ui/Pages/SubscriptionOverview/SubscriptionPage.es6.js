import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';

import { Notification } from '@contentful/forma-36-react-components';

import Workbench from 'app/common/Workbench.es6';
import { showDialog as showCreateSpaceModal } from 'services/CreateSpace.es6';
import { showDialog as showChangeSpaceModal } from 'services/ChangeSpaceService.es6';
import { openDeleteSpaceDialog } from 'services/DeleteSpace.es6';
import { isOwner } from 'services/OrganizationRoles.es6';

import BasePlan from './BasePlan.es6';
import UsersForPlan from './UsersForPlan.es6';
import SpacePlans from './SpacePlans.es6';
import Sidebar from './Sidebar.es6';

const styles = {
  content: css({
    // TODO: $rhythm for emotion?
    padding: '1.28rem 2rem 0'
  }),
  header: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridGap: '45px',
    '& > div': {
      margin: '1em 0 3em'
    }
  })
};

const notificationMessage = (space, currentSpacePlan, newSpacePlan) => {
  let notificationMsg = `Space ${space.name} successfully`;

  if (currentSpacePlan) {
    const changeType = newSpacePlan.price >= currentSpacePlan.price ? 'upgraded' : 'downgraded';
    notificationMsg = `${notificationMsg} ${changeType} to a ${newSpacePlan.name} space.`;
  } else {
    notificationMsg = `${notificationMsg} changed.`;
  }

  return notificationMsg;
};

export default function SubscriptionPage({ organizationId, data }) {
  const [changedSpace, setChangedSpace] = useState(null);
  const [spacePlans, setSpacePlans] = useState(data.spacePlans);

  useEffect(() => {
    changedSpace &&
      setTimeout(() => {
        setChangedSpace(null);
      }, 6000);
  }, [changedSpace]);

  const createSpace = () => {
    showCreateSpaceModal(organizationId);
  };

  const deleteSpace = (space, plan) => {
    return () => {
      openDeleteSpaceDialog({
        space,
        plan,
        onSuccess: () => {
          const newSpacePlans = _.reject(spacePlans, sp => sp.space.sys.id === space.sys.id);

          setSpacePlans(newSpacePlans);
        }
      });
    };
  };

  const changeSpace = (space, action) => {
    return () => {
      showChangeSpaceModal({
        organizationId: organizationId,
        scope: 'organization',
        space,
        action,
        onSubmit: async productRatePlanId => {
          // Update current spacePlan for this space with new data
          const productRatePlan = data.productRatePlans.find(
            prp => prp.sys.id === productRatePlanId
          );
          const currentSpacePlan = _.cloneDeep(
            spacePlans.find(sp => sp.space.sys.id === space.sys.id)
          );

          const newSpacePlans = spacePlans.map(spacePlan => {
            if (spacePlan.space.sys.id !== space.sys.id) {
              return spacePlan;
            }

            spacePlan.price = productRatePlan.price;
            spacePlan.name = productRatePlan.name;

            return spacePlan;
          });

          const newSpacePlan = spacePlans.find(sp => sp.space.sys.id === space.sys.id);

          setSpacePlans(newSpacePlans);
          setChangedSpace(space.sys.id);

          Notification.success(notificationMessage(space, currentSpacePlan, newSpacePlan));
        }
      });
    };
  };

  const { basePlan, usersMeta, organization, grandTotal } = data;

  return (
    <Workbench title="Subscription" icon="subscription" testId="subscription-page">
      <Workbench.Content className={styles.content}>
        <div className={styles.header}>
          <BasePlan basePlan={basePlan} organizationId={organizationId} />
          <UsersForPlan usersMeta={usersMeta} organizationId={organizationId} />
        </div>
        <SpacePlans
          basePlan={basePlan}
          spacePlans={spacePlans}
          upgradedSpace={changedSpace}
          onCreateSpace={createSpace}
          onChangeSpace={changeSpace}
          onDeleteSpace={deleteSpace}
          isOrgOwner={isOwner(organization)}
        />
      </Workbench.Content>
      <Workbench.Sidebar>
        <Sidebar
          basePlan={basePlan}
          organizationId={organizationId}
          grandTotal={grandTotal}
          spacePlans={spacePlans}
          isOrgOwner={isOwner(organization)}
          isOrgBillable={Boolean(organization.isBillable)}
        />
      </Workbench.Sidebar>
    </Workbench>
  );
}

SubscriptionPage.propTypes = {
  organizationId: PropTypes.string.isRequired,
  data: PropTypes.shape({
    basePlan: PropTypes.object,
    spacePlans: PropTypes.array,
    grandTotal: PropTypes.number,
    usersMeta: PropTypes.object,
    organization: PropTypes.object,
    productRatePlans: PropTypes.array
  }).isRequired
};
