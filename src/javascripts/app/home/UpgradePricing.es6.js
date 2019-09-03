import React from 'react';
import { Card } from '@contentful/forma-36-react-components';
import { isOwnerOrAdmin } from 'services/OrganizationRoles.es6';
import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';
import Icon from 'ui/Components/Icon.es6';
import { websiteUrl } from 'Config.es6';
import isLegacyEnterprise from 'data/isLegacyEnterprise.es6';
import { UPGRADE_PRICING_FLAG } from 'featureFlags.es6';
import { getModule } from 'NgRegistry.es6';
import { trackClickCTA } from './tracking.es6';

const spaceContext = getModule('spaceContext');
export default class UpgradePricing extends React.Component {
  state = {};
  async shouldShow(org) {
    if (!org) {
      return false;
    }

    if (!isOwnerOrAdmin(org)) {
      return false;
    }

    if (org.pricingVersion !== 'pricing_version_1') {
      return false;
    }

    if (isLegacyEnterprise(org)) {
      return false;
    }

    return true;
  }
  async componentDidMount() {
    const org = spaceContext.getData('organization');
    const showUpgrade = await this.shouldShow(org);

    const variation = await getCurrentVariation(UPGRADE_PRICING_FLAG);
    this.setState({
      flag: variation,
      show: showUpgrade
    });
  }

  // this is unbound method, since we don't use `this` inside
  // make it an arrow function if you want to use it.
  onUpgradeClick() {
    trackClickCTA('upgrade_pricing_space_home');
  }

  render() {
    const { show, flag } = this.state;

    if (!show || !flag) {
      return null;
    }

    return (
      <Card padding="large" className="upgrade-space--container">
        <div className="upgrade-space--content">
          <h2 className="home-section__heading" data-test-id="greeting">
            Upgrade your Space to access our latest feature
          </h2>
          <p className="upgrade-space--text">
            We made it easier to update and manage content models with our new{' '}
            <a
              href={websiteUrl('/developers/docs/concepts/multiple-environments/')}
              rel="noopener noreferrer"
              target="_blank">
              Space environments feature
            </a>{' '}
            and migration CLI tool. To access this feature, submit a request to begin the process of
            upgrading your space.
            <br />
            To learn more, read about our{' '}
            <a
              href={websiteUrl(
                '/pricing/?faq_category=payments&faq=what-type-of-spaces-can-i-have#payments'
              )}
              rel="noopener noreferrer"
              target="_blank">
              Space types and pricing
            </a>
            .
          </p>
          <a
            className="btn-secondary-action"
            onClick={this.onUpgradeClick}
            href={websiteUrl('/support/?upgrade-pricing=true')}
            rel="noopener noreferrer"
            target="_blank">
            Submit a request
          </a>
        </div>
        <div className="upgrade-space--graphics">
          <Icon height={145} name={'space-diagram'} />
        </div>
      </Card>
    );
  }
}
