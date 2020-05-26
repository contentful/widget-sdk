import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import { Notification, Workbench } from '@contentful/forma-36-react-components';

import { track } from 'analytics/Analytics';
import { showDialog as showCreateSpaceModal } from 'services/CreateSpace';
import {
  showDialog as showChangeSpaceModal,
  getNotificationMessage,
} from 'services/ChangeSpaceService';
import { openDeleteSpaceDialog } from 'features/space-settings';
import { isOwner } from 'services/OrganizationRoles';

import BasePlan from './BasePlan';
import UsersForPlan from './UsersForPlan';
import SpacePlans from './SpacePlans';
import Sidebar from './Sidebar';
import NavigationIcon from 'ui/Components/NavigationIcon';
import { isEnterprisePlan } from 'account/pricing/PricingDataProvider';

const styles = {
  content: css({
    // TODO: $rhythm for emotion?
    padding: '1.28rem 2rem',
  }),
  sidebar: css({
    position: 'relative',
  }),
  header: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridGap: '45px',
    '& > div': {
      margin: '1em 0 3em',
    },
  }),
};

const hasAnyInaccessibleSpaces = (plans) => {
  return plans.some((plan) => {
    const space = plan.space;
    return space && !space.isAccessible;
  });
};

export default function SubscriptionPage({ initialLoad, organizationId, data }) {
  const [changedSpaceId, setChangedSpaceId] = useState('');
  const [spacePlans, setSpacePlans] = useState([]);

  useEffect(() => {
    let timer;

    if (changedSpaceId) {
      timer = setTimeout(() => {
        setChangedSpaceId(null);
      }, 6000);
    }

    return () => clearTimeout(timer);
  }, [changedSpaceId]);

  useEffect(() => {
    setSpacePlans(data.spacePlans || []);
  }, [data.spacePlans]);

  const createSpace = () => {
    showCreateSpaceModal(organizationId);
  };

  const deleteSpace = (space, plan) => {
    return () => {
      openDeleteSpaceDialog({
        space,
        plan,
        onSuccess: () => {
          const newSpacePlans = spacePlans.filter((plan) => {
            return plan.space && plan.space.sys.id !== space.sys.id;
          });

          setSpacePlans(newSpacePlans);
        },
      });
    };
  };

  const changeSpace = (space) => {
    return () => {
      track('subscription_overview:upgrade_plan_link_clicked', {
        organizationId,
        spaceId: space.sys.id,
      });

      showChangeSpaceModal({
        action: 'change',
        organizationId,
        scope: 'organization',
        space,
        onSubmit: async (productRatePlanId) => {
          // Update current spacePlan for this space with new data
          const productRatePlan = data.productRatePlans.find(
            (prp) => prp.sys.id === productRatePlanId
          );
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

          setSpacePlans(newSpacePlans);
          setChangedSpaceId(space.sys.id);

          Notification.success(getNotificationMessage(space, currentSpacePlan, newSpacePlan));
        },
      });
    };
  };

  const { basePlan, usersMeta, organization, grandTotal } = data;

  const enterprisePlan = basePlan && isEnterprisePlan(basePlan);
  const anyInaccessibleSpaces = hasAnyInaccessibleSpaces(spacePlans);
  const orgIsBillable = organization && organization.isBillable;

  return (
    <Workbench testId="subscription-page">
      <Workbench.Header
        icon={<NavigationIcon icon="subscription" size="large" color="green" />}
        title="Subscription"
      />
      <Workbench.Content className={styles.content}>
        <div className={styles.header}>
          <BasePlan basePlan={basePlan} organizationId={organizationId} />
          <UsersForPlan
            organizationId={organizationId}
            numberFreeUsers={usersMeta && usersMeta.numFree}
            numberPaidUsers={usersMeta && usersMeta.numPaid}
            costOfUsers={usersMeta && usersMeta.cost}
          />
        </div>
        <SpacePlans
          initialLoad={initialLoad}
          spacePlans={spacePlans}
          upgradedSpaceId={changedSpaceId}
          onCreateSpace={createSpace}
          onChangeSpace={changeSpace}
          onDeleteSpace={deleteSpace}
          enterprisePlan={enterprisePlan}
        />
      </Workbench.Content>
      <Workbench.Sidebar position="right" className={styles.sidebar}>
        <Sidebar
          initialLoad={initialLoad}
          organizationId={organizationId}
          grandTotal={grandTotal}
          hasAnyInaccessibleSpaces={anyInaccessibleSpaces}
          enterprisePlan={enterprisePlan}
          isOrgOwner={isOwner(organization)}
          isOrgBillable={orgIsBillable}
        />
      </Workbench.Sidebar>
    </Workbench>
  );
}

SubscriptionPage.propTypes = {
  initialLoad: PropTypes.bool,
  organizationId: PropTypes.string.isRequired,
  data: PropTypes.shape({
    basePlan: PropTypes.object,
    spacePlans: PropTypes.array,
    grandTotal: PropTypes.number,
    usersMeta: PropTypes.object,
    organization: PropTypes.object,
    productRatePlans: PropTypes.array,
  }).isRequired,
};

SubscriptionPage.defaultProps = {
  initialLoad: true,
};
