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
    canChangeSpace: PropTypes.bool.isRequired,
    subscriptionState: PropTypes.object.isRequired,
    upgradeSpace: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
  }

  renderAddButton() {
    return (
      <div className="entity-sidebar__widget">
        <StateLink path="^.new">
          {({ onClick }) => (
            <Button onClick={onClick} isFullWidth buttonType="primary" testId="add-locales-button">
              Add Locale
            </Button>
          )}
        </StateLink>
      </div>
    );
  }

  renderChangeSpace() {
    const { localeResource, canChangeSpace } = this.props;
    let instruction = '';
    if (localeResource.limits.maximum > 1) {
      if (canChangeSpace) {
        instruction = 'Delete an existing locale or change the space to add more.';
      } else {
        instruction = `Delete an existing locale or ask the administrator of your organization to change the space to add more.`;
      }
    } else {
      if (canChangeSpace) {
        instruction = 'Change the space to add more.';
      } else {
        instruction = 'Ask the administrator of your organization to change the space to add more.';
      }
    }
    return (
      <div data-test-id="change-space-block">
        <Typography>
          <Paragraph>{instruction}</Paragraph>
        </Typography>
        {canChangeSpace && (
          <div className="entity-sidebar__widget">
            <Button
              onClick={this.props.upgradeSpace}
              isFullWidth
              buttonType="primary"
              testId="locales-change">
              Upgrade space
            </Button>
          </div>
        )}
      </div>
    );
  }

  renderUsage() {
    const { localeResource } = this.props;
    const isReachedLimit = localeResource.usage >= localeResource.limits.maximum;
    return (
      <WorkbenchSidebarItem testId="locales-usage" title="Usage">
        <Typography>
          <Paragraph>
            You are using {localeResource.usage} out of{' '}
            <Pluralized text="locale" count={localeResource.limits.maximum} /> available in this
            space.
          </Paragraph>
        </Typography>
        {isReachedLimit ? this.renderChangeSpace() : this.renderAddButton()}
      </WorkbenchSidebarItem>
    );
  }

  render() {
    const { insideMasterEnv, allowedToEnforceLimits } = this.props;

    return (
      <>
        {allowedToEnforceLimits || insideMasterEnv ? this.renderUsage() : this.renderAddButton()}
        <DocumentationsSection />
      </>
    );
  }
}
