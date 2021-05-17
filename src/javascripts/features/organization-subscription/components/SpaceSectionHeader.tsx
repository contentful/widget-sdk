import React, { useState } from 'react';
import { css } from 'emotion';
import {
  Paragraph,
  Flex,
  Heading,
  TextLink,
  Tooltip,
  Icon,
  Button,
  Notification,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { RouteLink } from 'core/react-routing';

import { track } from 'analytics/Analytics';
import { Pluralized, Price } from 'core/components/formatting';

import { createSpace } from '../utils/spaceUtils';
import { downloadSpacesUsage } from '../services/SpacesUsageService';

const styles = {
  inaccessibleHelpIcon: css({
    fill: tokens.colorElementDarkest,
    marginBottom: '-3px',
    marginLeft: tokens.spacingXs,
  }),
  marginLeftXs: css({
    marginLeft: tokens.spacingXs,
  }),
};

interface SpaceSectionHeaderProps {
  // It tells the header to render in its loading state
  isLoading: boolean;
  // It tells the header if the user is in an Enterprise plan or not
  enterprisePlan?: boolean;
  // For Self Service customers, we show their total cost in the header
  selServiceTotalCost?: number;
  // It tells the header to show the tooltip with informaton about inaccessible spaces
  hasAnySpacesInaccessible?: boolean;
  // Feature flag that enables space creation for Enterprise customers
  isCreateSpaceForSpacePlanEnabled?: boolean;
  // Feature flag that controls if we show the rebranded space section header or not
  isSpaceSectionRebrandingEnabled?: boolean;
  // The number of space plans of the current organization
  numberOfSpaces: number;
  // The id of the current organization
  organizationId: string;
}

export function SpaceSectionHeader({
  isLoading,
  enterprisePlan = false,
  selServiceTotalCost = 0,
  hasAnySpacesInaccessible = false,
  isCreateSpaceForSpacePlanEnabled = false,
  isSpaceSectionRebrandingEnabled = false,
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

  // if the feature flag is off, show the user the old space section heading
  // once we think it's safe to have only the rebranded heading, remove this if statement
  if (!isLoading && !isSpaceSectionRebrandingEnabled) {
    return (
      <span data-test-id="space-section-header-previous-version">
        <Heading className="section-title">
          Spaces
          {hasAnySpacesInaccessible && <InaccessibleHelpIcon />}
        </Heading>

        <Flex alignItems="center" justifyContent="space-between" marginBottom="spacingM">
          <Paragraph testId="subscription-page.organization-information">
            {numberOfSpaces > 0 ? (
              <>
                Your organization has{' '}
                <b>
                  <Pluralized text="space" count={numberOfSpaces} />
                </b>
                {'. '}
              </>
            ) : (
              'Your organization doesn’t have any spaces. '
            )}

            {!enterprisePlan && selServiceTotalCost > 0 && (
              <span data-test-id="subscription-page.non-enterprise-price-information">
                The total for your spaces is{' '}
                <b>
                  <Price value={selServiceTotalCost} />
                </b>{' '}
                per month.{' '}
              </span>
            )}
            {enterprisePlan && isCreateSpaceForSpacePlanEnabled ? (
              <RouteLink
                as={TextLink}
                route={{
                  path: 'organizations.subscription.overview.create-space',
                  orgId: organizationId,
                }}
                onClick={() => {
                  track('space_creation:begin', {
                    flow: 'space_creation',
                  });
                }}>
                Create Space
              </RouteLink>
            ) : (
              <TextLink testId="subscription-page.create-space" onClick={onCreateSpace}>
                Create Space
              </TextLink>
            )}
          </Paragraph>
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
        </Flex>
      </span>
    );
  }

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
        icon="HelpCircle"
        className={styles.inaccessibleHelpIcon}
      />
    </Tooltip>
  );
}
