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
import { CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM } from 'analytics/utmLinks';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const urlWithUtm = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'environments-sidebar',
  campaign: 'in-app-help',
});

const docLinks = {
  domainModelConcepts: urlWithUtm(`${Config.developerDocsUrl}/concepts/domain-model/`),
  envAliasesConcepts: urlWithUtm(`${Config.developerDocsUrl}/concepts/environment-aliases/`),
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

export function EnvironmentsSidebar({
  isLoading,
  canCreateEnv,
  resource,
  canUpgradeSpace,
  OpenCreateDialog,
  OpenCreateAliasDialog,
  OpenUpgradeSpaceDialog,
  customAliasesEnabled,
  canManageAliases,
  hasOptedInEnv,
  hasNextSpacePlan,
  spaceId,
  allSpaceAliases,
  organizationId,
}) {
  // Master is not included in the api, display +1 usage and limit
  const usage = resource.usage + 1;
  const limit = get(resource, 'limits.maximum', -1) + 1;
  const shouldShowAliasDefinition = canManageAliases || hasOptedInEnv;
  const loadedHasNextSpacePlan = hasNextSpacePlan !== undefined;

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
      {hasOptedInEnv && (
        <>
          <Heading element="h2" className={`${css({ marginTop: 0 })} entity-sidebar__heading`}>
            Environment Alias Usage
          </Heading>

          {!isLoading && (
            <>
              <Typography>
                <Paragraph testId="environmentsAliasUsage">
                  {customAliasesEnabled
                    ? `You are using ${allSpaceAliases.length} out of 3 environment aliases available `
                    : 'You have one environment alias available '}
                  in this space.
                </Paragraph>
              </Typography>

              {canManageAliases && customAliasesEnabled && allSpaceAliases.length < 3 && (
                <Button
                  isFullWidth
                  testId="openCreateAliasDialog"
                  buttonType="muted"
                  onClick={OpenCreateAliasDialog}>
                  Add environment alias
                </Button>
              )}
            </>
          )}
        </>
      )}

      <Heading
        element="h2"
        className={`${
          allSpaceAliases.length > 0 ? '' : css({ marginTop: 0 })
        } entity-sidebar__heading`}>
        Environment Usage
      </Heading>

      {!isLoading && (
        <>
          <Typography>
            <Paragraph testId="environmentsUsage">
              You are using {usage}{' '}
              {limit ? `out of ${limit} environments available ` : pluralize('environment', usage)}{' '}
              in this space.
              <UsageTooltip resource={resource} />
            </Paragraph>
            {!canCreateEnv && (
              <Paragraph testId="upgradeMessage">
                {!canUpgradeSpace &&
                  'Ask the administrator of your organization to upgrade the space plan.'}
                {canUpgradeSpace &&
                  loadedHasNextSpacePlan &&
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
        </>
      )}

      {!canCreateEnv && canUpgradeSpace && loadedHasNextSpacePlan && (
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
        {shouldShowAliasDefinition && (
          <>
            <Paragraph className={sidebarStyles.subHeaderFirst}>Environment Aliases</Paragraph>
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
        <Paragraph
          className={
            shouldShowAliasDefinition ? sidebarStyles.subHeader : sidebarStyles.subHeaderFirst
          }>
          Environment
        </Paragraph>
        <Paragraph>
          Environments allow you to develop and test changes to data in isolation.
          <br />
          See the{' '}
          <ExternalTextLink href={docLinks.domainModelConcepts}>
            Contentful domain model
          </ExternalTextLink>{' '}
          for details.
        </Paragraph>
      </Typography>
    </>
  );
}
EnvironmentsSidebar.propTypes = {
  canCreateEnv: PropTypes.bool,
  resource: PropTypes.object,
  customAliasesEnabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  canUpgradeSpace: PropTypes.bool,
  OpenCreateDialog: PropTypes.func.isRequired,
  OpenCreateAliasDialog: PropTypes.func.isRequired,
  OpenUpgradeSpaceDialog: PropTypes.func.isRequired,
  canManageAliases: PropTypes.bool.isRequired,
  hasOptedInEnv: PropTypes.bool.isRequired,
  hasNextSpacePlan: PropTypes.bool,
  spaceId: PropTypes.string,
  allSpaceAliases: PropTypes.arrayOf(PropTypes.object).isRequired,
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
      <Icon icon="InfoCircle" color="muted" testId="environments-usage-tooltip" />
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
      href={CONTACT_SALES_URL_WITH_IN_APP_BANNER_UTM}
      onClick={handleOnClick}>
      Talk to us
    </Button>
  );
}
UpgradeToEnterpriseButton.propTypes = UpgradeButtonProptypes;
