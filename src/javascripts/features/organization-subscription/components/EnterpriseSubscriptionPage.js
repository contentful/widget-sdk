import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import {
  Flex,
  Grid,
  SkeletonBodyText,
  SkeletonContainer,
  SkeletonDisplayText,
  Workbench,
} from '@contentful/forma-36-react-components';

import { isOwnerOrAdmin } from 'services/OrganizationRoles';

import { BasePlan } from './BasePlan';
import { UsersForPlan } from './UsersForPlan';
import { SpacePlans } from './SpacePlans';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import ContactUsButton from 'ui/Components/ContactUsButton';
import { EnterpriseTrialInfo, isOrganizationOnTrial, SpacesListForMembers } from 'features/trials';
import { createSpace, changeSpace, deleteSpace } from '../utils/spaceUtils';
import { hasAnyInaccessibleSpaces } from '../utils/utils';

const styles = {
  fullRow: css({
    gridColumnStart: 1,
    gridColumnEnd: 3,
  }),
};

export function EnterpriseSubscriptionPage({
  basePlan,
  usersMeta,
  organization,
  initialLoad,
  spacePlans,
  onSpacePlansChange,
  memberAccessibleSpaces,
}) {
  const organizationId = organization?.sys.id;
  const [changedSpaceId, setChangedSpaceId] = useState('');

  // TODO: Refactor into own hook to use in both subscription pages
  useEffect(() => {
    let timer;

    if (changedSpaceId) {
      timer = setTimeout(() => {
        setChangedSpaceId(null);
      }, 6000);
    }

    return () => clearTimeout(timer);
  }, [changedSpaceId]);

  const onCreateSpace = createSpace(organizationId);
  const onChangeSpace = changeSpace(
    organizationId,
    spacePlans,
    onSpacePlansChange,
    setChangedSpaceId
  );
  const onDeleteSpace = deleteSpace(spacePlans, onSpacePlansChange);

  const isOrgOwnerOrAdmin = isOwnerOrAdmin(organization);
  const isOrgOnEnterpriseTrial = isOrganizationOnTrial(organization);
  const isNotAdminOrOwnerOfTrialOrg = isOrgOnEnterpriseTrial && !isOrgOwnerOrAdmin;
  const anySpacesInaccessible = !!spacePlans && hasAnyInaccessibleSpaces(spacePlans);

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
                <Flex flexDirection="column" marginBottom="spacingXl">
                  <UsersForPlan
                    organizationId={organizationId}
                    numberFreeUsers={usersMeta && usersMeta.numFree}
                    numberPaidUsers={usersMeta && usersMeta.numPaid}
                    costOfUsers={usersMeta && usersMeta.cost}
                    unitPrice={usersMeta && usersMeta.unitPrice}
                    hardLimit={usersMeta && usersMeta.hardLimit}
                    isFreePlan={false}
                    isOnEnterpriseTrial={isOrgOnEnterpriseTrial}
                  />
                </Flex>
              )}
            </Flex>
          )}

          {organization && isOrgOnEnterpriseTrial && (
            <Flex className={styles.fullRow} flexDirection="column">
              <EnterpriseTrialInfo organization={organization} />
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
                onCreateSpace={onCreateSpace}
                onChangeSpace={onChangeSpace}
                organizationId={organizationId}
                onDeleteSpace={onDeleteSpace}
                enterprisePlan={true}
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

EnterpriseSubscriptionPage.propTypes = {
  initialLoad: PropTypes.bool.isRequired,
  basePlan: PropTypes.object,
  spacePlans: PropTypes.array,
  usersMeta: PropTypes.object,
  organization: PropTypes.object,
  onSpacePlansChange: PropTypes.func,
  memberAccessibleSpaces: PropTypes.array,
};

EnterpriseSubscriptionPage.defaultProps = {
  initialLoad: true,
};
