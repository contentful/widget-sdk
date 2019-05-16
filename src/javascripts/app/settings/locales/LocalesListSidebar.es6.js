import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@contentful/forma-36-react-components';
import Pluralized from 'ui/Components/Pluralized.es6';
import StateLink from 'app/common/StateLink.es6';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';
import { ENVIRONMENT_USAGE_ENFORCEMENT } from 'featureFlags.es6';

const DocumentationsSection = () => (
  <div data-test-id="locales-documentation">
    <h2 className="entity-sidebar__heading">Documentation</h2>
    <div className="entity-sidebar__text-profile">
      <p>
        Contentful enables publishing content in multiple language. To translate your content, add a
        locale, and enable translation for each necessary field in your content.
      </p>
    </div>
  </div>
);

export default class LocalesListSidebar extends React.Component {
  static propTypes = {
    localeResource: PropTypes.object.isRequired,
    insideMasterEnv: PropTypes.bool.isRequired,
    canChangeSpace: PropTypes.bool.isRequired,
    subscriptionState: PropTypes.object.isRequired,
    upgradeSpace: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    getCurrentVariation(ENVIRONMENT_USAGE_ENFORCEMENT).then(allowedToEnforceLimits => {
      this.setState({ allowedToEnforceLimits });
    });
  }

  renderAddButton() {
    return (
      <div className="entity-sidebar__widget">
        <StateLink to="^.new">
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
        <p>{instruction}</p>
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
      <div data-test-id="locales-usage">
        <h2 style={{ marginTop: 0 }} className="entity-sidebar__heading">
          Usage
        </h2>
        <div className="entity-sidebar__text-profile">
          <p>
            You are using {localeResource.usage} out of{' '}
            <Pluralized text="locale" count={localeResource.limits.maximum} /> available in this
            space.
          </p>
          {isReachedLimit ? this.renderChangeSpace() : this.renderAddButton()}
        </div>
      </div>
    );
  }

  render() {
    const { insideMasterEnv } = this.props;
    const { allowedToEnforceLimits } = this.state;

    return (
      <div className="entity-sidebar">
        {allowedToEnforceLimits || insideMasterEnv ? this.renderUsage() : this.renderAddButton()}
        <DocumentationsSection />
      </div>
    );
  }
}
