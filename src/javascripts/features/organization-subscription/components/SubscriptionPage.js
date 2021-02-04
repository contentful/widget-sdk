import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css, cx } from 'emotion';
import {
  Notification,
  Workbench,
  Heading,
  DisplayText,
  ModalLauncher,
  Note,
  Paragraph,
  Typography,
  TextLink,
  SkeletonBodyText,
  SkeletonContainer,
  SkeletonDisplayText,
} from '@contentful/forma-36-react-components';
import { Grid } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { links } from '../utils';
import { go } from 'states/Navigator';

import { getModule } from 'core/NgRegistry';
import { beginSpaceCreation } from 'services/CreateSpace';
import { beginSpaceChange, getNotificationMessage } from 'services/ChangeSpaceService';
import { openDeleteSpaceDialog } from 'features/space-settings';
import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { Price } from 'core/components/formatting';
import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { getAppsRepo } from 'features/apps-core';
import { AppManager } from 'features/apps';

import { BasePlan } from './BasePlan';
import { ContentfulApps } from './ContentfulApps';
import { UsersForPlan } from './UsersForPlan';
import { SpacePlans } from './SpacePlans';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { isEnterprisePlan, isFreePlan } from 'account/pricing/PricingDataProvider';
import ContactUsButton from 'ui/Components/ContactUsButton';
import {
  EnterpriseTrialInfo,
  isOrganizationOnTrial,
  SpacesListForMembers,
  startAppTrial,
  StartAppTrialModal,
} from 'features/trials';

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
  go(links.billing(organizationId));
};

export function SubscriptionPage({
  basePlan,
  addOn,
  usersMeta,
  organization,
  grandTotal,
  organizationId,
  initialLoad,
  spacePlans,
  onSpacePlansChange,
  memberAccessibleSpaces,
  newSpacePurchaseEnabled,
  appTrialEnabled,
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

    beginSpaceCreation(organizationId);
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

  const handleStartAppTrial = async () => {
    Notification.success('Preparing the trial...');
    try {
      await startAppTrial(organization.sys.id, async (appNames) => {
        try {
          const apps = await Promise.all(appNames.map(getAppsRepo().getApp));
          const spaceContext = getModule('spaceContext');
          const appsManager = new AppManager(
            spaceContext.cma,
            spaceContext.getEnvironmentId(),
            spaceContext.getId(),
            organization.sys.id
          );
          await Promise.allSettled(apps.map((app) => appsManager.installApp(app, true)));
        } catch (e) {
          console.log(e);
          throw new Error('Failed to install Apps');
        }
      });
      // TODO: trial comms
      Notification.success('The App trial has started!');
    } catch (err) {
      Notification.error(`Could not start the trial: ${err.message}`);
    }
  };

  const showModal = () => {
    ModalLauncher.open(({ isShown, onClose }) => (
      <StartAppTrialModal isShown={isShown} onClose={onClose} onConfirm={handleStartAppTrial} />
    ));
  };

  const enterprisePlan = basePlan && isEnterprisePlan(basePlan);
  const isOrgBillable = organization && organization.isBillable;
  const isOrgOwner = isOwner(organization);
  const isOrgOwnerOrAdmin = isOwnerOrAdmin(organization);
  const isOrgOnTrial = isOrganizationOnTrial(organization);
  const isNotAdminOrOwnerOfTrialOrg = isOrgOnTrial && !isOrgOwnerOrAdmin;

  const showPayingOnDemandCopy = isOrgBillable && !enterprisePlan;
  const showContentfulAppsCard = isOrgOwnerOrAdmin && !!addOn;
  const showNonPayingOrgCopy = !isOrgBillable && isOrgOwner;
  const anySpacesInaccessible = !!spacePlans && hasAnyInaccessibleSpaces(spacePlans);

  const rightColumnHasContent = showPayingOnDemandCopy || showNonPayingOrgCopy;

  return (
    <Workbench testId="subscription-page">
      <Workbench.Header
        icon={<ProductIcon icon="Subscription" size="large" />}
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
            {organization && <EnterpriseTrialInfo organization={organization} />}
            {appTrialEnabled && (
              <div>
                <TextLink icon="PlusCircle" onClick={showModal}>
                  Start Contentful App trial
                </TextLink>
              </div>
            )}
          </div>
          {!isNotAdminOrOwnerOfTrialOrg && (
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
                  isOnEnterpriseTrial={isOrgOnTrial}
                />
              )}
            </div>
          )}
          {!isNotAdminOrOwnerOfTrialOrg && (
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
                      isOnEnterpriseTrial={isOrgOnTrial}
                    />
                  )}
                  {showPayingOnDemandCopy && <PayingOnDemandOrgCopy grandTotal={grandTotal} />}
                  {showContentfulAppsCard && (
                    <ContentfulApps organizationId={organizationId} addOn={addOn} />
                  )}
                  {showNonPayingOrgCopy && !newSpacePurchaseEnabled && (
                    <NonPayingOrgCopyLegacy organizationId={organizationId} />
                  )}
                  {showNonPayingOrgCopy && newSpacePurchaseEnabled && (
                    <NonPayingOrgCopy createSpace={createSpace} />
                  )}
                </>
              )}
            </div>
          )}
          <div className={cx(styles.spacesSection, styles.marginTop)}>
            {isNotAdminOrOwnerOfTrialOrg ? (
              <SpacesListForMembers spaces={memberAccessibleSpaces} />
            ) : (
              <SpacePlans
                initialLoad={initialLoad}
                spacePlans={spacePlans}
                upgradedSpaceId={changedSpaceId}
                onCreateSpace={createSpace}
                onChangeSpace={changeSpace}
                organizationId={organizationId}
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
  addOn: PropTypes.object,
  spacePlans: PropTypes.array,
  grandTotal: PropTypes.number,
  usersMeta: PropTypes.object,
  organization: PropTypes.object,
  onSpacePlansChange: PropTypes.func,
  memberAccessibleSpaces: PropTypes.array,
  newSpacePurchaseEnabled: PropTypes.bool,
  appTrialEnabled: PropTypes.bool,
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

function NonPayingOrgCopyLegacy({ organizationId }) {
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

NonPayingOrgCopyLegacy.propTypes = {
  organizationId: PropTypes.string.isRequired,
};

function NonPayingOrgCopy({ createSpace }) {
  return (
    <Typography testId="subscription-page.non-paying-org-limits">
      <Heading className="section-title">Your organization limits</Heading>
      <Paragraph>
        Your organization is currently limited to 5 users, 50MB per asset in your space, and no API
        overages. Add a paid space to remove these limits.
      </Paragraph>
      <TextLink
        icon="PlusCircle"
        testId="subscription-page.add-space-free-org-cta"
        onClick={createSpace}>
        Create a space
      </TextLink>
    </Typography>
  );
}

NonPayingOrgCopy.propTypes = {
  createSpace: PropTypes.func.isRequired,
};
