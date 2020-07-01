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

const envDocSidebarUtmParams =
  '?utm_source=webapp&utm_medium=environments-sidebar&utm_campaign=in-app-help';

const docLinks = {
  domainModelConcepts: `${Config.developerDocsUrl}/concepts/domain-model/${envDocSidebarUtmParams}`,
  envAliasesConcepts: `${Config.developerDocsUrl}/concepts/environment-aliases/${envDocSidebarUtmParams}`,
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
  spacePlan,
}) {
  // Master is not included in the api, display +1 usage and limit
  const usage = resource.usage + 1;
  const limit = get(resource, 'limits.maximum', -1) + 1;
  const shouldShowAliasDefinition = canManageAliases || hasOptedInEnv;

  // const handleBannerClickCTA = () => {
  //   const { spaceId } = this.props;
  //   const spaceContext = getModule('spaceContext');
  //   const orgId = spaceContext.organization.sys.id;

  //   track('targeted_cta_clicked:upgrade_to_enterprise', {
  //     ctaLocation: 'environments',
  //     spaceId,
  //     orgId,
  //   });
  // };

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
            {canUpgradeSpace
              ? spacePlan?.name === 'Large'
                ? 'Talk to us about upgrading to an enterprise space plan.'
                : 'Upgrade the space to add more.'
              : 'Ask the administrator of your organization to upgrade the space plan.'}
          </Paragraph>
        )}
      </Typography>

      {canCreateEnv && (
        <Button isFullWidth testId="openCreateDialog" onClick={OpenCreateDialog}>
          Add environment
        </Button>
      )}

      {/** We need to wait for the spacePlan or the button will jump from 'Upgrade space' to 'Talk to us' */}
      {!canCreateEnv && !isLegacyOrganization && canUpgradeSpace && !!spacePlan && (
        <UpgradeButton
          handleOpenUpgradeSpaceDialog={OpenUpgradeSpaceDialog}
          isLargePlan={spacePlan?.name === 'Large'}
        />
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
  spacePlan: PropTypes.object,
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

function UpgradeButton({ handleOpenUpgradeSpaceDialog, isLargePlan = false }) {
  if (isLargePlan) {
    return (
      <Button
        isFullWidth
        testId="upgradeToEnterpriseButton"
        href={Config.websiteUrl('contact/sales/')}>
        Talk to us
      </Button>
    );
  }

  return (
    <Button isFullWidth testId="openUpgradeDialog" onClick={() => handleOpenUpgradeSpaceDialog()}>
      Upgrade space
    </Button>
  );
}

UpgradeButton.propTypes = {
  handleOpenUpgradeSpaceDialog: PropTypes.func.isRequired,
  isLargePlan: PropTypes.bool,
};
