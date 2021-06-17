import React, { useState } from 'react';
import { css } from 'emotion';
import {
  Flex,
  Heading,
  Tooltip,
  Icon,
  Button,
  Notification,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { RouteLink } from 'core/react-routing';

import { track } from 'analytics/Analytics';

import { createSpace } from '../utils/spaceUtils';
import { downloadSpacesUsage } from '../services/SpacesUsageService';

const styles = {
  inaccessibleHelpIcon: css({
    marginBottom: '-3px',
    marginLeft: tokens.spacingXs,
  }),
  marginLeftXs: css({
    marginLeft: tokens.spacingXs,
  }),
};

interface SpaceSectionHeaderProps {
  // It tells the header if the user is in an Enterprise plan or not
  enterprisePlan?: boolean;
  // It tells the header to show the tooltip with informaton about inaccessible spaces
  hasAnySpacesInaccessible?: boolean;
  // Feature flag that enables space creation for Enterprise customers
  isCreateSpaceForSpacePlanEnabled?: boolean;
  // The number of space plans of the current organization
  numberOfSpaces: number;
  // The id of the current organization
  organizationId: string;
}

export function SpaceSectionHeader({
  enterprisePlan = false,
  hasAnySpacesInaccessible = false,
  isCreateSpaceForSpacePlanEnabled = false,
  numberOfSpaces,
  organizationId,
}: SpaceSectionHeaderProps) {
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  const onCreateSpace = createSpace(organizationId);

  // Export CSV
  const handleExportBtnClick = async () => {
    setIsExportingCSV(true);
    try {
      track('space_usage_summary:export');
      await downloadSpacesUsage(organizationId);
    } catch {
      Notification.error('Could not export the space usage.');
    }
    setIsExportingCSV(false);
  };

  return (
    <Flex
      testId="space-section-header"
      alignItems="center"
      justifyContent="space-between"
      marginBottom="spacingM">
      <Heading testId="space-section-heading">
        Spaces ({numberOfSpaces}){hasAnySpacesInaccessible && <InaccessibleHelpIcon />}
      </Heading>

      <span>
        {numberOfSpaces > 0 && (
          <Button
            testId="subscription-page.export-csv"
            disabled={isExportingCSV}
            loading={isExportingCSV}
            buttonType="muted"
            onClick={handleExportBtnClick}>
            Export
          </Button>
        )}
        {enterprisePlan && isCreateSpaceForSpacePlanEnabled ? (
          <RouteLink
            as={Button}
            testId="subscription-page.create-space"
            className={styles.marginLeftXs}
            route={{
              path: 'organizations.subscription.overview.create-space',
              orgId: organizationId,
            }}
            onClick={() => {
              track('space_creation:begin', {
                flow: 'space_creation',
              });
            }}>
            Add space
          </RouteLink>
        ) : (
          <Button
            testId="subscription-page.create-space"
            className={styles.marginLeftXs}
            onClick={onCreateSpace}>
            Add space
          </Button>
        )}
      </span>
    </Flex>
  );
}

function InaccessibleHelpIcon() {
  return (
    <Tooltip
      testId="inaccessible-help-tooltip"
      content={`You can’t see usage or content for spaces you’re not a member of.
      You can add yourself to these spaces in the organization users settings.`}>
      <Icon
        testId="inaccessible-help-icon"
        icon="InfoCircle"
        color="muted"
        className={styles.inaccessibleHelpIcon}
      />
    </Tooltip>
  );
}
