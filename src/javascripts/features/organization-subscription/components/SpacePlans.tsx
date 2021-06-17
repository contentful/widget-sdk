import React, { useCallback, useContext } from 'react';

import { getVariation, FLAGS } from 'core/feature-flags';
import { useAsync } from 'core/hooks';
import { openDeleteSpaceDialog } from 'features/space-settings';
import { SpacePlansTable } from '../space-usage-summary/SpacePlansTable';
import { SpaceSectionHeader } from './SpaceSectionHeader';
import { UsedAndUnusedSpacePlans } from './UsedAndUnusedSpacePlans';

import { OrgSubscriptionContext } from '../context';
import { actions } from '../context/orgSubscriptionReducer';
import { changeSpace } from '../utils/spaceUtils';
import { useChangedSpace } from '../hooks/useChangedSpace';
import { Paragraph } from '@contentful/forma-36-react-components';

async function fetchFeatureFlag(isEnterprisePlan: boolean) {
  let isCreateSpaceForSpacePlanEnabled = false;

  // we only need these flags for organizations with Enterprise basePlan
  if (isEnterprisePlan) {
    isCreateSpaceForSpacePlanEnabled = await getVariation(FLAGS.CREATE_SPACE_FOR_SPACE_PLAN);
  }

  return {
    isCreateSpaceForSpacePlanEnabled,
  };
}

interface SpacePlansProps {
  // It tells the header if the user is in an Enterprise plan or not
  enterprisePlan?: boolean;
  // It tells if the user is an admin or org owner
  isOwnerOrAdmin?: boolean;
  // The id of the current organization
  organizationId: string;
  showV1MigrationCommunication?: boolean;
}

export function SpacePlans({
  enterprisePlan = false,
  isOwnerOrAdmin = false,
  organizationId,
  showV1MigrationCommunication,
}: SpacePlansProps) {
  const {
    dispatch,
    state: { spacePlans },
  } = useContext(OrgSubscriptionContext);

  const { changedSpaceId, setChangedSpaceId } = useChangedSpace();

  // fetch feature flags
  const { isLoading, data } = useAsync(
    useCallback(() => fetchFeatureFlag(enterprisePlan), [enterprisePlan])
  );

  // Enterprise admin or owners can manage used and unused spaces
  const userCanManageSpaces = enterprisePlan && isOwnerOrAdmin;

  // Space CRUD functions
  const onChangeSpace = changeSpace(
    organizationId,
    spacePlans,
    (newSpacePlans) => dispatch({ type: actions.SET_SPACE_PLANS, payload: newSpacePlans }),
    setChangedSpaceId
  );
  const getOnDeleteSpace = (plan) => () => {
    openDeleteSpaceDialog({
      plan,
      space: plan.space,
      onSuccess: () => dispatch({ type: actions.DELETE_SPACE, payload: plan.space.sys.id }),
    });
  };

  const numberOfSpaces = spacePlans.length;
  const hasAnySpacesInaccessible = spacePlans.some((plan) => !plan.space?.isAccessible);

  return (
    <>
      <SpaceSectionHeader
        enterprisePlan={enterprisePlan}
        hasAnySpacesInaccessible={hasAnySpacesInaccessible}
        isCreateSpaceForSpacePlanEnabled={data?.isCreateSpaceForSpacePlanEnabled}
        numberOfSpaces={numberOfSpaces}
        organizationId={organizationId}
      />

      {numberOfSpaces === 0 && <Paragraph>Add a space to start using Contentful.</Paragraph>}

      {numberOfSpaces > 0 && (
        <>
          {!userCanManageSpaces && (
            <SpacePlansTable
              organizationId={organizationId}
              enterprisePlan={enterprisePlan}
              featureFlagLoading={isLoading}
              onChangeSpace={onChangeSpace}
              onDeleteSpace={getOnDeleteSpace}
              plans={spacePlans}
              upgradedSpaceId={changedSpaceId}
              showV1MigrationCommunication={showV1MigrationCommunication}
            />
          )}

          {/* This will only be rendered for Enterprise organizations */}
          {!isLoading && userCanManageSpaces && (
            <UsedAndUnusedSpacePlans
              organizationId={organizationId}
              changedSpaceId={changedSpaceId}
              isCreateSpaceForSpacePlanEnabled={data?.isCreateSpaceForSpacePlanEnabled}
              onChangeSpace={onChangeSpace}
              onDeleteSpace={getOnDeleteSpace}
              spacePlans={spacePlans}
            />
          )}
        </>
      )}
    </>
  );
}
