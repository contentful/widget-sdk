import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import { Button } from '@contentful/forma-36-react-components';
import Pluralized from 'ui/Components/Pluralized.es6';
import StateLink from 'app/common/StateLink.es6';

const LaunchDarkly = getModule('utils/LaunchDarkly/index.es6');

class IncentivizeUpgradeExperiment extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired
  };

  state = {
    isInitialized: false,
    variation: undefined
  };

  componentDidMount() {
    LaunchDarkly.getCurrentVariation('feature-bv-06-2018-incentivize-upgrade')
      .then(variation => {
        this.setState({ variation, isInitialized: true });
      })
      .catch(() => {
        this.setState({ variation: undefined, isInitialized: true });
      });
  }

  render() {
    if (!this.state.isInitialized) {
      return null;
    }
    return this.props.children(this.state.variation);
  }
}

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
          <IncentivizeUpgradeExperiment>
            {variation => {
              return variation ? (
                <div className="entity-sidebar__widget">
                  <Button
                    onClick={this.props.upgradeSpace}
                    isFullWidth
                    buttonType="primary"
                    testId="locales-change">
                    Upgrade space
                  </Button>
                </div>
              ) : (
                <span>
                  <StateLink
                    to={this.props.subscriptionState.path.join('.')}
                    params={this.props.subscriptionState.params}
                    options={this.props.subscriptionState.options}
                    className="text-link upgrade-link">
                    Go to the subscription page
                  </StateLink>{' '}
                  to change.
                </span>
              );
            }}
          </IncentivizeUpgradeExperiment>
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
    return (
      <div className="entity-sidebar">
        {!this.props.insideMasterEnv && this.renderAddButton()}
        {this.props.insideMasterEnv && this.renderUsage()}
        <DocumentationsSection />
      </div>
    );
  }
}
