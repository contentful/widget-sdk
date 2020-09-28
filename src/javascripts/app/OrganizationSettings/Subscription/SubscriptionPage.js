import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css, cx } from 'emotion';
import {
  Notification,
  Workbench,
  Heading,
  DisplayText,
  Note,
  Paragraph,
  Typography,
  TextLink,
  SkeletonBodyText,
  SkeletonContainer,
  SkeletonDisplayText,
} from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { billing } from './links';
import { go } from 'states/Navigator';

import { showDialog as showCreateSpaceModal } from 'services/CreateSpace';
import {
  showDialog as showChangeSpaceModal,
  getNotificationMessage,
} from 'services/ChangeSpaceService';
import { openDeleteSpaceDialog } from 'features/space-settings';
import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { Price } from 'core/components/formatting';
import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';

import BasePlan from './BasePlan';
import UsersForPlan from './UsersForPlan';
import SpacePlans from './SpacePlans';
import { NavigationIcon } from '@contentful/forma-36-react-components/dist/alpha';
import {
  isEnterprisePlan,
  isFreePlan,
  isEnterpriseTrialPlan,
} from 'account/pricing/PricingDataProvider';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { PlatformTrialInfo, isOrganizationOnTrial, SpacesListForMembers } from 'features/trials';

const styles = {
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
  marginTop: css({
    marginTop: tokens.spacingXl,
  }),
  talkToUsSection: css({
    gridColumnEnd: 3,
    textAlign: 'right',
    marginBottom: tokens.spacingM,
    display: 'flex',
    justifyContent: 'flex-end',
    '& > svg': {
      maxWidth: '150px',
    },
  }),
  leftSection: css({
    '& > div:not(:first-child)': {
      marginTop: tokens.spacingXl,
    },

    gridRowStart: 3,
  }),
  rightSection: css({
    '& > div:not(:first-child)': {
      marginTop: tokens.spacingXl,
    },

    gridColumnStart: 2,
    gridRowStart: 3,
  }),
  spacesSection: css({
    gridColumnEnd: 3,
    gridColumnStart: 1,
    gridRowStart: 4,
  }),
  trialSection: css({
    '& > div': {
      marginBottom: tokens.spacingXl,
    },

    gridRowStart: 2,
  }),
};

const goToBillingPage = (organizationId) => {
  go(billing(organizationId));
};

export default function SubscriptionPage({
  basePlan,
  usersMeta,
  organization,
  grandTotal,
  showMicroSmallSupportCard,
  organizationId,
  initialLoad,
  spacePlans,
  onSpacePlansChange,
  isPlatformTrialCommEnabled,
  memberAccessibleSpaces,
}) {
  const [changedSpaceId, setChangedSpaceId] = useState('');

  useEffect(() => {
    let timer;

    if (changedSpaceId) {
      timer = setTimeout(() => {
        setChangedSpaceId(null);
      }, 6000);
    }

    return () => clearTimeout(timer);
  }, [changedSpaceId]);

  const createSpace = () => {
    trackCTAClick(CTA_EVENTS.CREATE_SPACE, { organizationId });

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

          onSpacePlansChange(newSpacePlans);
        },
      });
    };
  };

  const changeSpace = (space) => {
    return () => {
      trackCTAClick(CTA_EVENTS.UPGRADE_SPACE_PLAN, { organizationId, spaceId: space.sys.id });

      showChangeSpaceModal({
        action: 'change',
        organizationId,
        scope: 'organization',
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

  const isMemberOfTrialOrg =
    isPlatformTrialCommEnabled &&
    !isOwnerOrAdmin(organization) &&
    isOrganizationOnTrial(organization);

  const enterprisePlan = basePlan && isEnterprisePlan(basePlan);
  const isOrgBillable = organization && organization.isBillable;
  const isOrgOwner = isOwner(organization);
  const isOrgOwnerOrAdmin = isOwnerOrAdmin(organization);

  const showPayingOnDemandCopy = isOrgBillable && !enterprisePlan;
  const showAddBillingDetailsCopy = !isOrgBillable && isOrgOwner;
  const anySpacesInaccessible = !!spacePlans && hasAnyInaccessibleSpaces(spacePlans);

  const rightColumnHasContent = showPayingOnDemandCopy || showAddBillingDetailsCopy;

  return (
    <Workbench testId="subscription-page">
      <Workbench.Header
        icon={<NavigationIcon icon="Subscription" size="large" />}
        title="Subscription"
      />
      <Workbench.Content className={styles.content}>
        <Grid columns={2} rows="auto auto auto" columnGap="spacingXl">
          <div className={styles.talkToUsSection}>
            {initialLoad ? (
              <SkeletonContainer svgHeight={25}>
                <SkeletonBodyText numberOfLines={1} />
              </SkeletonContainer>
            ) : (
              <ContactUsButton isLink />
            )}
          </div>
          <div className={styles.trialSection}>
            {isPlatformTrialCommEnabled && <PlatformTrialInfo organization={organization} />}
          </div>
          {!isMemberOfTrialOrg && (
            <div className={styles.leftSection}>
              {initialLoad ? (
                <SkeletonContainer svgHeight={117}>
                  <SkeletonDisplayText />
                  <SkeletonBodyText numberOfLines={4} offsetTop={29} />
                </SkeletonContainer>
              ) : (
                <BasePlan basePlan={basePlan} organizationId={organizationId} />
              )}
              {rightColumnHasContent && (
                <UsersForPlan
                  organizationId={organizationId}
                  numberFreeUsers={usersMeta && usersMeta.numFree}
                  numberPaidUsers={usersMeta && usersMeta.numPaid}
                  costOfUsers={usersMeta && usersMeta.cost}
                  unitPrice={usersMeta && usersMeta.unitPrice}
                  hardLimit={usersMeta && usersMeta.hardLimit}
                  isFreePlan={isFreePlan(basePlan)}
                  isOnEnterpriseTrial={isEnterpriseTrialPlan(basePlan)}
                />
              )}
            </div>
          )}
          {!isMemberOfTrialOrg && (
            <div className={styles.rightSection}>
              {initialLoad ? (
                <SkeletonContainer svgHeight={117}>
                  <SkeletonDisplayText />
                  <SkeletonBodyText numberOfLines={4} offsetTop={29} />
                </SkeletonContainer>
              ) : (
                <>
                  {!rightColumnHasContent && (
                    <UsersForPlan
                      organizationId={organizationId}
                      numberFreeUsers={usersMeta && usersMeta.numFree}
                      numberPaidUsers={usersMeta && usersMeta.numPaid}
                      costOfUsers={usersMeta && usersMeta.cost}
                      unitPrice={usersMeta && usersMeta.unitPrice}
                      hardLimit={usersMeta && usersMeta.hardLimit}
                      isFreePlan={isFreePlan(basePlan)}
                      isOnEnterpriseTrial={isEnterpriseTrialPlan(basePlan)}
                    />
                  )}
                  {showPayingOnDemandCopy && <PayingOnDemandOrgCopy grandTotal={grandTotal} />}
                  {showAddBillingDetailsCopy && (
                    <NonPayingOrgCopy organizationId={organizationId} />
                  )}
                </>
              )}
            </div>
          )}
          <div className={cx(styles.spacesSection, styles.marginTop)}>
            {isMemberOfTrialOrg ? (
              <SpacesListForMembers spaces={memberAccessibleSpaces} />
            ) : (
              <SpacePlans
                initialLoad={initialLoad}
                spacePlans={spacePlans}
                upgradedSpaceId={changedSpaceId}
                onCreateSpace={createSpace}
                onChangeSpace={changeSpace}
                organizationId={organizationId}
                showMicroSmallSupportCard={showMicroSmallSupportCard}
                onDeleteSpace={deleteSpace}
                enterprisePlan={enterprisePlan}
                anySpacesInaccessible={anySpacesInaccessible}
                isOwnerOrAdmin={isOrgOwnerOrAdmin}
              />
            )}
          </div>
        </Grid>
      </Workbench.Content>
    </Workbench>
  );
}

SubscriptionPage.propTypes = {
  initialLoad: PropTypes.bool.isRequired,
  organizationId: PropTypes.string.isRequired,
  basePlan: PropTypes.object,
  spacePlans: PropTypes.array,
  grandTotal: PropTypes.number,
  usersMeta: PropTypes.object,
  organization: PropTypes.object,
  showMicroSmallSupportCard: PropTypes.bool,
  onSpacePlansChange: PropTypes.func,
  isPlatformTrialCommEnabled: PropTypes.bool,
  memberAccessibleSpaces: PropTypes.array,
};

SubscriptionPage.defaultProps = {
  initialLoad: true,
};

function hasAnyInaccessibleSpaces(plans) {
  return plans.some((plan) => {
    const space = plan.space;
    return space && !space.isAccessible;
  });
}

function PayingOnDemandOrgCopy({ grandTotal }) {
  return (
    <Typography>
      <Heading className="section-title">Monthly total</Heading>
      <DisplayText
        element="h2"
        data-test-id="subscription-page.sidebar.grand-total"
        className={styles.grandTotal}>
        <Price value={grandTotal} testId="on-demand-monthly-cost" />
      </DisplayText>
      <Note>
        The amount on your invoice might differ from the amount shown above because of usage
        overages or changes you make to the subscription during a billing cycle.
      </Note>
    </Typography>
  );
}

PayingOnDemandOrgCopy.propTypes = {
  grandTotal: PropTypes.number.isRequired,
};

function NonPayingOrgCopy({ organizationId }) {
  return (
    <Typography testId="subscription-page.billing-copy">
      <Heading className="section-title">Your payment details</Heading>
      <Paragraph>
        You need to provide us with your billing address and credit card details before creating
        paid spaces or adding users beyond the free limit.
      </Paragraph>
      <TextLink
        icon="Receipt"
        testId="subscription-page.add-billing-button"
        onClick={() => goToBillingPage(organizationId)}>
        Enter payment details
      </TextLink>
    </Typography>
  );
}

NonPayingOrgCopy.propTypes = {
  organizationId: PropTypes.string.isRequired,
};
