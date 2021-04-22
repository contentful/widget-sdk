import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { css } from 'emotion';
import { Flex, Grid } from '@contentful/forma-36-react-components';

import { isOwnerOrAdmin } from 'services/OrganizationRoles';

import { SpacePlans } from './SpacePlans';
import { fetchWebappContentByEntryID } from 'core/services/ContentfulCDA';
import { EnterpriseTrialInfo, isOrganizationOnTrial, SpacesListForMembers } from 'features/trials';
import { createSpace, changeSpace, deleteSpace } from '../utils/spaceUtils';
import { hasAnyInaccessibleSpaces } from '../utils/utils';
import { BasePlanCard } from './BasePlanCard';
import { useChangedSpace } from '../hooks/useChangedSpace';

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
  const { changedSpaceId, setChangedSpaceId } = useChangedSpace();
  const [content, setContent] = useState();

  // TODO: create custom hook to fetch baseplan content
  useEffect(() => {
    const fetchBasePlanContent = async () => {
      const entryContent = await fetchWebappContentByEntryID('G7TaplIVAIntn3QIDaSCd');

      setContent(entryContent);
    };

    fetchBasePlanContent();
  }, [basePlan]);

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
    <Grid columns={2} columnGap="spacingXl" rowGap="spacingXl">
      {content && (
        <Flex flexDirection="column" className={styles.fullRow}>
          <BasePlanCard
            content={content}
            organizationId={organizationId}
            users={
              usersMeta && {
                count: usersMeta.numFree + usersMeta.numPaid,
                limit: usersMeta.hardLimit,
              }
            }
          />
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
