import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { Pluralized } from 'core/components/formatting';
import StateLink from 'app/common/StateLink';
import { Typography, Paragraph } from '@contentful/forma-36-react-components';
import WorkbenchSidebarItem from 'app/common/WorkbenchSidebarItem';
import ExternalTextLink from 'app/common/ExternalTextLink';
import { developerDocsUrl } from 'Config';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { websiteUrl } from 'Config';
import { trackTargetedCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import TrackTargetedCTAImpression from 'app/common/TrackTargetedCTAImpression';
import { getModule } from 'core/NgRegistry';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'locales-sidebar',
  campaign: 'in-app-help',
});

const documentationsSectionStyles = {
  paragraph: css({
    marginBottom: tokens.spacingM,
  }),
};

const DocumentationsSection = () => (
  <WorkbenchSidebarItem testId="locales-documentation" title="Documentation">
    <Paragraph className={documentationsSectionStyles.paragraph}>
      Locales enable you to publish in multiple languages.
    </Paragraph>
    <Paragraph className={documentationsSectionStyles.paragraph}>
      See our{' '}
      <ExternalTextLink
        testId="locales-documentation-link"
        href={withInAppHelpUtmParams(`${developerDocsUrl}/concepts/locales/`)}>
        developer documentation
      </ExternalTextLink>{' '}
      for details.
    </Paragraph>
  </WorkbenchSidebarItem>
);

export class LocalesListSidebar extends React.Component {
  static propTypes = {
    localeResource: PropTypes.object.isRequired,
    allowedToEnforceLimits: PropTypes.bool.isRequired,
    insideMasterEnv: PropTypes.bool.isRequired,
    isOrgOwnerOrAdmin: PropTypes.bool.isRequired,
    upgradeSpace: PropTypes.func.isRequired,
    hasNextSpacePlan: PropTypes.bool,
  };

  constructor(props) {
    super(props);
  }

  renderChangeSpace() {
    const { localeResource, isOrgOwnerOrAdmin, hasNextSpacePlan } = this.props;

    let instruction = '';
    if (localeResource.limits.maximum > 1) {
      if (isOrgOwnerOrAdmin) {
        instruction = hasNextSpacePlan
          ? 'Upgrade the space to add more.'
          : 'Talk to us about upgrading to an enterprise space plan.';
      } else {
        instruction = `Ask the administrator of your organization to upgrade the space to add more locales.`;
      }
    } else {
      if (isOrgOwnerOrAdmin) {
        instruction = 'Upgrade the space to add more.';
      } else {
        instruction =
          'Ask the administrator of your organization to upgrade the space to add more locales.';
      }
    }

    return (
      <div data-test-id="change-space-block">
        <Typography>
          <Paragraph>{instruction}</Paragraph>
        </Typography>
        {isOrgOwnerOrAdmin &&
          (hasNextSpacePlan ? (
            <UpgradeOnDemand upgradeSpace={this.props.upgradeSpace} />
          ) : (
            <UpgradeToEnterprise />
          ))}
      </div>
    );
  }

  render() {
    const { insideMasterEnv, allowedToEnforceLimits, localeResource } = this.props;
    const isReachedLimit = localeResource.usage >= localeResource.limits.maximum;

    return (
      <>
        {allowedToEnforceLimits || insideMasterEnv ? (
          <WorkbenchSidebarItem testId="locales-usage" title="Usage">
            <Typography>
              <Paragraph>
                You are using {localeResource.usage} out of{' '}
                <Pluralized text="locale" count={localeResource.limits.maximum} /> available in this
                space.
              </Paragraph>
            </Typography>
            {isReachedLimit ? this.renderChangeSpace() : <AddLocaleButton />}
          </WorkbenchSidebarItem>
        ) : (
          <AddLocaleButton />
        )}
        <DocumentationsSection />
      </>
    );
  }
}

const handleTalkToUsClickCTA = () => {
  const spaceContext = getModule('spaceContext');

  trackTargetedCTAClick(CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
    spaceId: spaceContext.getId(),
    organizationId: spaceContext.organization.sys.id,
  });
};

const UpgradeToEnterprise = () => {
  const spaceContext = getModule('spaceContext');
  const spaceId = spaceContext.getId();
  const organizationId = spaceContext.organization.sys.id;

  return (
    <TrackTargetedCTAImpression
      impressionType={CTA_EVENTS.UPGRADE_TO_ENTERPRISE}
      meta={{ spaceId, organizationId }}>
      <Button
        isFullWidth
        buttonType="primary"
        testId="link-to-sales-button"
        href={websiteUrl('contact/sales/')}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleTalkToUsClickCTA()}>
        Talk to us
      </Button>
    </TrackTargetedCTAImpression>
  );
};

const UpgradeOnDemand = ({ upgradeSpace }) => {
  return (
    <Button isFullWidth buttonType="primary" testId="locales-change" onClick={upgradeSpace}>
      Upgrade space
    </Button>
  );
};
UpgradeOnDemand.propTypes = { upgradeSpace: PropTypes.func.isRequired };

const AddLocaleButton = () => {
  return (
    <StateLink path="^.new">
      {({ onClick }) => (
        <Button onClick={onClick} isFullWidth buttonType="primary" testId="add-locales-button">
          Add Locale
        </Button>
      )}
    </StateLink>
  );
};
