import React from 'react';
import PropTypes from 'prop-types';
import { Heading, Paragraph, Button, Card } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ConnectWithAppIllustration from 'svg/illustrations/connected-shapes.svg';
import { track } from 'analytics/Analytics';
import { getCurrentStateName } from 'states/Navigator';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';

const styles = {
  svgContainerExtension: css({ width: '171px', marginTop: '-20px' }),
  flexContainer: css({
    display: 'flex',
    height: '100%',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingL,
  }),
  button: css({
    marginTop: tokens.spacingL,
  }),
  illustrationContainer: css({
    alignSelf: 'flex-start',
  }),
  heading: css({
    fontSize: tokens.fontSizeL,
    marginBottom: tokens.spacingS,
  }),
  description: css({
    fontSize: tokens.fontSizeM,
    paddingRight: tokens.spacingL,
  }),
};

const withInAppHelpUtmParams = buildUrlWithUtmParams({
  source: 'webapp',
  medium: 'apps-cta-button',
  campaign: 'in-app-help',
});

const AppsFrameworkIntroBanner = ({ canManageApps }) => {
  const ctaLink = canManageApps
    ? 'https://www.contentful.com/developers/docs/extensibility/app-framework/'
    : 'https://www.contentful.com/app-framework/';
  return (
    <Card className={styles.flexContainer} padding="large">
      <div>
        <Heading className={styles.heading}>Introducing Contentful apps</Heading>
        <Paragraph className={styles.description}>
          Contentful apps extend the capabilities of the Contentful web app and the editors who use
          it. Apps empower you to integrate third-party services, build efficient workflows and
          customize the functionality of the Contentful web app.
        </Paragraph>
        <Button
          className={styles.button}
          onClick={() =>
            track('element:click', {
              elementId: 'apps_documentation_link',
              groupId: 'apps_listing_page',
              fromState: getCurrentStateName(),
            })
          }
          target="_blank"
          rel="noopener noreferrer"
          href={withInAppHelpUtmParams(ctaLink)}>
          Learn more about Contentful apps
        </Button>
      </div>
      <div className={styles.illustrationContainer}>
        <ConnectWithAppIllustration className={styles.svgContainerExtension} />
      </div>
    </Card>
  );
};

AppsFrameworkIntroBanner.propTypes = {
  canManageApps: PropTypes.bool,
};

export default AppsFrameworkIntroBanner;
