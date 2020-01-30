import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';
import Pluralized from 'ui/Components/Pluralized';
import StateLink from 'app/common/StateLink';
import { Typography, Paragraph } from '@contentful/forma-36-react-components';
import WorkbenchSidebarItem from 'app/common/WorkbenchSidebarItem';

const DocumentationsSection = () => (
  <WorkbenchSidebarItem testId="locales-documentation" title="Documentation">
    <Paragraph>
      Contentful enables publishing content in multiple language. To translate your content, add a
      locale, and enable translation for each necessary field in your content.
    </Paragraph>
  </WorkbenchSidebarItem>
);

export default class LocalesListSidebar extends React.Component {
  static propTypes = {
    localeResource: PropTypes.object.isRequired,
    allowedToEnforceLimits: PropTypes.bool.isRequired,
    insideMasterEnv: PropTypes.bool.isRequired,
    canChangeSpace: PropTypes.bool.isRequired,
    subscriptionState: PropTypes.object.isRequired,
    upgradeSpace: PropTypes.func.isRequired
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
