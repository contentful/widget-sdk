import React from 'react';
import {
  Card,
  Button,
  TextLink,
  Typography,
  Heading,
  Paragraph,
} from '@contentful/forma-36-react-components';
import { isOwnerOrAdmin } from 'services/OrganizationRoles';
import Icon from 'ui/Components/Icon';
import { websiteUrl } from 'Config';
import isLegacyEnterprise from 'data/isLegacyEnterprise';
import { trackClickCTA } from './tracking';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import { WidgetContainer } from './widgets/WidgetContainer';

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'upgrade-pricing',
  campaign: 'in-app-help',
});

export class UpgradePricing extends React.Component {
  state = {
    show: false,
  };

  static contextType = SpaceEnvContext;

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
    const org = this.context.currentOrganization;
    const showUpgrade = await this.shouldShow(org);

    this.setState({
      show: showUpgrade,
    });
  }

  // this is unbound method, since we don't use `this` inside
  // make it an arrow function if you want to use it.
  onUpgradeClick() {
    trackClickCTA('upgrade_pricing_space_home');
  }

  render() {
    const { show } = this.state;

    if (!show) {
      return null;
    }

    return (
      <WidgetContainer.Col>
        <Card padding="large" className="upgrade-space--container">
          <div className="upgrade-space--content">
            <Typography>
              <Heading testId="greeting">Upgrade your Space to access our latest feature</Heading>
              <Paragraph>
                We made it easier to update and manage content models with our new{' '}
                <TextLink
                  href={withInAppHelpUtmParams(
                    websiteUrl('/developers/docs/concepts/multiple-environments/')
                  )}
                  rel="noopener noreferrer"
                  target="_blank">
                  Space environments feature
                </TextLink>{' '}
                and migration CLI tool. To access this feature, submit a request to begin the
                process of upgrading your space.
                <br />
                To learn more, read about our{' '}
                <TextLink
                  href={withInAppHelpUtmParams(
                    websiteUrl(
                      '/pricing/?faq_category=payments&faq=what-type-of-spaces-can-i-have#payments'
                    )
                  )}
                  rel="noopener noreferrer"
                  target="_blank">
                  Space types and pricing
                </TextLink>
                .
              </Paragraph>
            </Typography>

            <Button
              buttonType="muted"
              onClick={this.onUpgradeClick}
              href={withInAppHelpUtmParams(websiteUrl('/support/?upgrade-pricing=true'))}
              rel="noopener noreferrer"
              target="_blank">
              Submit a request
            </Button>
          </div>
          <div className="upgrade-space--graphics">
            <Icon height={145} name={'space-diagram'} />
          </div>
        </Card>
      </WidgetContainer.Col>
    );
  }
}
