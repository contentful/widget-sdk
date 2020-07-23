import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { get } from 'lodash';
import { css } from 'emotion';
import {
  Heading,
  Typography,
  Paragraph,
  Button,
  Tooltip,
  Icon,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import * as Config from 'Config';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { trackTargetedCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';

const ENV_DOC_SIDEBAR_UTM_PARAMS =
  '?utm_source=webapp&utm_medium=environments-sidebar&utm_campaign=in-app-help';

const docLinks = {
  domainModelConcepts: `${Config.developerDocsUrl}/concepts/domain-model/${ENV_DOC_SIDEBAR_UTM_PARAMS}`,
  envAliasesConcepts: `${Config.developerDocsUrl}/concepts/environment-aliases/${ENV_DOC_SIDEBAR_UTM_PARAMS}`,
};

const sidebarStyles = {
  subHeaderFirst: css({
    fontSize: tokens.fontSizeM,
    marginBottom: tokens.spacingXs,
    color: tokens.colorTextDark,
  }),
  subHeader: css({
    fontSize: tokens.fontSizeM,
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingXs,
    color: tokens.colorTextDark,
  }),
};

export default function EnvironmentsSidebar({
  canCreateEnv,
  resource,
  isLegacyOrganization,
  canUpgradeSpace,
  OpenCreateDialog,
  OpenUpgradeSpaceDialog,
  aliasesEnabled,
  canManageAliases,
  hasOptedInEnv,
  hasNextSpacePlan,
  spaceId,
  organizationId,
}) {
  // Master is not included in the api, display +1 usage and limit
  const usage = resource.usage + 1;
  const limit = get(resource, 'limits.maximum', -1) + 1;
  const shouldShowAliasDefinition = canManageAliases || hasOptedInEnv;

  const upgradeToEnterpriseOnClick = () => {
    trackTargetedCTAClick(CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
      spaceId,
      organizationId,
    });
  };

  const upgradeOnDemandOnClick = () => {
    trackTargetedCTAClick(CTA_EVENTS.UPGRADE_SPACE_PLAN, { organizationId, spaceId });
    OpenUpgradeSpaceDialog();
  };

  return (
    <>
      <Heading element="h2" className={`${css({ marginTop: 0 })} entity-sidebar__heading`}>
        Usage
      </Heading>

      <Typography>
        <Paragraph testId="environmentsUsage">
          You are using {usage}{' '}
          {limit ? `out of ${limit} environments available ` : pluralize('environment', usage)} in
          this space.
          {!isLegacyOrganization && <UsageTooltip resource={resource} />}
        </Paragraph>
        {!canCreateEnv && !isLegacyOrganization && (
          <Paragraph testId="upgradeMessage">
            {!canUpgradeSpace &&
              'Ask the administrator of your organization to upgrade the space plan.'}
            {canUpgradeSpace &&
              hasNextSpacePlan !== undefined &&
              (hasNextSpacePlan
                ? 'Upgrade the space to add more.'
                : 'Talk to us about upgrading to an enterprise space plan.')}
          </Paragraph>
        )}
      </Typography>

      {canCreateEnv && (
        <Button isFullWidth testId="openCreateDialog" onClick={OpenCreateDialog}>
          Add environment
        </Button>
      )}

      {/* We wait until we explicitly get a value for `hasNextSpacePlan` before rendering the CTA */}
      {!canCreateEnv && !isLegacyOrganization && canUpgradeSpace && hasNextSpacePlan !== undefined && (
        <TrackTargetedCTAImpression
          impressionType={
            hasNextSpacePlan ? CTA_EVENTS.UPGRADE_SPACE_PLAN : CTA_EVENTS.UPGRADE_TO_ENTERPRISE
          }
          meta={{ organizationId, spaceId }}>
          {hasNextSpacePlan ? (
            <UpgradeOnDemandButton handleOnClick={upgradeOnDemandOnClick} />
          ) : (
            <UpgradeToEnterpriseButton handleOnClick={upgradeToEnterpriseOnClick} />
          )}
        </TrackTargetedCTAImpression>
      )}

      <Heading element="h2" className="entity-sidebar__heading">
        Documentation
      </Heading>

      <Typography>
        <Paragraph className={sidebarStyles.subHeaderFirst}>Environment</Paragraph>
        <Paragraph>
          Environments allow you to develop and test changes to data in isolation.
          <br />
          See the{' '}
          <ExternalTextLink href={docLinks.domainModelConcepts}>
            Contentful domain model
          </ExternalTextLink>{' '}
          for details.
        </Paragraph>
        {aliasesEnabled && shouldShowAliasDefinition && (
          <>
            <Paragraph className={sidebarStyles.subHeader}>Environment Aliases</Paragraph>
            <Paragraph>
              An environment alias allows you to access and modify the data of an environment
              through a different static identifier.
              <br />
              Read our{' '}
              <ExternalTextLink href={docLinks.envAliasesConcepts}>
                environment alias documentation
              </ExternalTextLink>{' '}
              for more information.
            </Paragraph>
          </>
        )}
      </Typography>
    </>
  );
}
EnvironmentsSidebar.propTypes = {
  canCreateEnv: PropTypes.bool,
  aliasesEnabled: PropTypes.bool,
  resource: PropTypes.object,
  isLegacyOrganization: PropTypes.bool,
  canUpgradeSpace: PropTypes.bool,
  OpenCreateDialog: PropTypes.func.isRequired,
  OpenUpgradeSpaceDialog: PropTypes.func.isRequired,
  canManageAliases: PropTypes.bool.isRequired,
  hasOptedInEnv: PropTypes.bool.isRequired,
  hasNextSpacePlan: PropTypes.bool,
  spaceId: PropTypes.string,
  organizationId: PropTypes.string,
};

function UsageTooltip({ resource }) {
  const limit = get(resource, 'limits.maximum');
  if (!limit) {
    return null;
  }

  const tooltipContent = (
    <div>
      This space type includes {pluralize('sandbox environment', limit, true)}
      <br />
      additional to the master environment
    </div>
  );

  return (
    <Tooltip
      content={tooltipContent}
      place="bottom"
      targetWrapperClassName={css({
        marginLeft: tokens.spacingXs,
      })}
      className={css({
        color: tokens.colorElementDarkest,
      })}>
      <Icon icon="HelpCircle" color="muted" testId="environments-usage-tooltip" />
    </Tooltip>
  );
}

UsageTooltip.propTypes = {
  resource: PropTypes.object.isRequired,
};

const UpgradeButtonProptypes = {
  handleOnClick: PropTypes.func.isRequired,
};

function UpgradeOnDemandButton({ handleOnClick }) {
  return (
    <Button isFullWidth testId="openUpgradeDialog" onClick={handleOnClick}>
      Upgrade space
    </Button>
  );
}
UpgradeOnDemandButton.propTypes = UpgradeButtonProptypes;

function UpgradeToEnterpriseButton({ handleOnClick }) {
  return (
    <Button
      isFullWidth
      testId="upgradeToEnterpriseButton"
      href={Config.websiteUrl('contact/sales/')}
      onClick={handleOnClick}>
      Talk to us
    </Button>
  );
}
UpgradeToEnterpriseButton.propTypes = UpgradeButtonProptypes;
