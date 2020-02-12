import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';

import { Notification, Workbench } from '@contentful/forma-36-react-components';

import { showDialog as showCreateSpaceModal } from 'services/CreateSpace';
import { showDialog as showChangeSpaceModal } from 'services/ChangeSpaceService';
import { openDeleteSpaceDialog } from 'services/DeleteSpace';
import { isOwner } from 'services/OrganizationRoles';

import BasePlan from './BasePlan';
import UsersForPlan from './UsersForPlan';
import SpacePlans from './SpacePlans';
import Sidebar from './Sidebar';
import Icon from 'ui/Components/Icon';

const styles = {
  content: css({
    // TODO: $rhythm for emotion?
    padding: '1.28rem 2rem 0'
  }),
  sidebar: css({
    position: 'relative'
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

const getNotificationMessage = (space, currentSpacePlan, newSpacePlan) => {
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

          Notification.success(getNotificationMessage(space, currentSpacePlan, newSpacePlan));
        }
      });
    };
  };

  const { basePlan, usersMeta, organization, grandTotal } = data;

  return (
    <Workbench testId="subscription-page">
      <Workbench.Header icon={<Icon name="subscription" />} title="Subscription" />
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
      <Workbench.Sidebar position="right" className={styles.sidebar}>
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
