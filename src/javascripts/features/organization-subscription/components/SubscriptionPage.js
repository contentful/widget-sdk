import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import {
  DisplayText,
  Flex,
  Grid,
  Heading,
  Note,
  Notification,
  Paragraph,
  SkeletonBodyText,
  SkeletonContainer,
  SkeletonDisplayText,
  TextLink,
  Typography,
  Workbench,
} from '@contentful/forma-36-react-components';

import { links } from '../utils';
import { go } from 'states/Navigator';

import { beginSpaceCreation } from 'services/CreateSpace';
import { beginSpaceChange, getNotificationMessage } from 'services/ChangeSpaceService';
import { openDeleteSpaceDialog } from 'features/space-settings';
import { isOwner, isOwnerOrAdmin } from 'services/OrganizationRoles';
import { Price } from 'core/components/formatting';
import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';

import { BasePlan } from './BasePlan';
import { ContentfulApps } from './ContentfulApps';
import { ContentfulAppsTrial } from './ContentfulAppsTrial';
import { UsersForPlan } from './UsersForPlan';
import { SpacePlans } from './SpacePlans';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { isEnterprisePlan, isFreePlan } from 'account/pricing/PricingDataProvider';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { EnterpriseTrialInfo, isOrganizationOnTrial, SpacesListForMembers } from 'features/trials';

const styles = {
  fullRow: css({
    gridColumnStart: 1,
    gridColumnEnd: 3,
  }),
};

const goToBillingPage = (organizationId) => {
  go(links.billing(organizationId));
};

export function SubscriptionPage({
  basePlan,
  addOnPlan,
  usersMeta,
  organization,
  grandTotal,
  organizationId,
  initialLoad,
  spacePlans,
  onSpacePlansChange,
  memberAccessibleSpaces,
  newSpacePurchaseEnabled,
  composeAndLaunchEnabled,
  appTrialEnabled,
  isTrialAvailable,
  isTrialActive,
  isTrialExpired,
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
    go({
      path: ['account', 'organizations', 'start_trial'],
      params: { orgId: organizationId, existingUsers: true },
    });
  };

  const enterprisePlan = basePlan && isEnterprisePlan(basePlan);
  const isOrgBillable = organization && organization.isBillable;
  const isOrgOwner = isOwner(organization);
  const isOrgOwnerOrAdmin = isOwnerOrAdmin(organization);
  const isOrgOnTrial = isOrganizationOnTrial(organization);
  const isNotAdminOrOwnerOfTrialOrg = isOrgOnTrial && !isOrgOwnerOrAdmin;

  const showPayingOnDemandCopy = isOrgBillable && !enterprisePlan;
  const showNonPayingOrgCopy = !isOrgBillable && isOrgOwner;

  // Contentful Apps card should not show to Enterprise orgs and user is not Admin/Owner
  const showContentfulAppsCard =
    composeAndLaunchEnabled && !enterprisePlan && isOrgOwnerOrAdmin && !!addOnPlan;
  const showContentfulAppsTrial =
    appTrialEnabled && !enterprisePlan && isOrgOwnerOrAdmin && !addOnPlan;

  const anySpacesInaccessible = !!spacePlans && hasAnyInaccessibleSpaces(spacePlans);

  const rightColumnHasContent =
    showPayingOnDemandCopy ||
    showNonPayingOrgCopy ||
    showContentfulAppsCard ||
    showContentfulAppsTrial;

  return (
    <Workbench testId="subscription-page">
      <Workbench.Header
        icon={<ProductIcon icon="Subscription" size="large" />}
        title="Subscription"
      />
      {/* the workbench needs this 'position relative' here or it will render double scrollbars when its children have 'flex-direction: column' */}
      <Workbench.Content className={css({ position: 'relative' })}>
        <Flex className={styles.fullRow} justifyContent="flex-end" marginBottom="spacingM">
          <ContactUsButton disabled={initialLoad} isLink />
        </Flex>

        <Grid columns={2} columnGap="spacingXl" rowGap="spacingXl">
          {organization && isOrgOnTrial && (
            <Flex className={styles.fullRow} flexDirection="column">
              <EnterpriseTrialInfo organization={organization} />
            </Flex>
          )}

          {!isNotAdminOrOwnerOfTrialOrg && (
            <Flex flexDirection="column">
              {initialLoad ? (
                <SkeletonContainer svgHeight={117}>
                  <SkeletonDisplayText />
                  <SkeletonBodyText numberOfLines={4} offsetTop={29} />
                </SkeletonContainer>
              ) : (
                <BasePlan basePlan={basePlan} organizationId={organizationId} />
              )}
              {rightColumnHasContent && (
                <Flex flexDirection="column" marginTop="spacingXl">
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
                </Flex>
              )}
            </Flex>
          )}
          {!isNotAdminOrOwnerOfTrialOrg && (
            <Flex flexDirection="column">
              {initialLoad ? (
                <SkeletonContainer svgHeight={117}>
                  <SkeletonDisplayText />
                  <SkeletonBodyText numberOfLines={4} offsetTop={29} />
                </SkeletonContainer>
              ) : (
                <>
                  {!rightColumnHasContent && (
                    <Flex flexDirection="column" marginBottom="spacingXl">
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
                    </Flex>
                  )}
                  {showPayingOnDemandCopy && (
                    <Flex flexDirection="column" marginBottom="spacingXl">
                      <PayingOnDemandOrgCopy grandTotal={grandTotal} />
                    </Flex>
                  )}
                  {showContentfulAppsTrial && (
                    <Flex flexDirection="column">
                      <ContentfulAppsTrial
                        organization={organization}
                        startAppTrial={handleStartAppTrial}
                        isTrialAvailable={isTrialAvailable}
                        isTrialActive={isTrialActive}
                        isTrialExpired={isTrialExpired}
                      />
                    </Flex>
                  )}
                  {showContentfulAppsCard && (
                    <Flex flexDirection="column">
                      <ContentfulApps organizationId={organizationId} addOnPlan={addOnPlan} />
                    </Flex>
                  )}
                  {showNonPayingOrgCopy && !newSpacePurchaseEnabled && (
                    <Flex flexDirection="column" marginTop="spacingXl">
                      <NonPayingOrgCopyLegacy organizationId={organizationId} />
                    </Flex>
                  )}
                  {showNonPayingOrgCopy && newSpacePurchaseEnabled && (
                    <Flex flexDirection="column" marginTop="spacingXl">
                      <NonPayingOrgCopy createSpace={createSpace} />
                    </Flex>
                  )}
                </>
              )}
            </Flex>
          )}

          <Flex className={styles.fullRow} flexDirection="column">
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
          </Flex>
        </Grid>
      </Workbench.Content>
    </Workbench>
  );
}

SubscriptionPage.propTypes = {
  initialLoad: PropTypes.bool.isRequired,
  organizationId: PropTypes.string.isRequired,
  basePlan: PropTypes.object,
  addOnPlan: PropTypes.object,
  spacePlans: PropTypes.array,
  grandTotal: PropTypes.number,
  usersMeta: PropTypes.object,
  organization: PropTypes.object,
  onSpacePlansChange: PropTypes.func,
  memberAccessibleSpaces: PropTypes.array,
  newSpacePurchaseEnabled: PropTypes.bool,
  composeAndLaunchEnabled: PropTypes.bool,
  appTrialEnabled: PropTypes.bool,
  isTrialAvailable: PropTypes.bool,
  isTrialActive: PropTypes.bool,
  isTrialExpired: PropTypes.bool,
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
