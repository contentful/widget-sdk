import React from 'react';
import { Heading, Paragraph, Button, Card } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import ConnectWithAppIllustration from 'svg/connected-shapes.svg';
import { track } from 'analytics/Analytics';
import { getCurrentStateName } from 'states/Navigator';

const styles = {
  svgContainerExtension: css({ width: '171px', marginTop: '-20px' }),
  flexContainer: css({
    display: 'flex',
    height: '100%',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingL
  }),
  button: css({
    marginTop: tokens.spacingM
  }),
  illustrationContainer: css({
    alignSelf: 'flex-start'
  }),
  heading: css({
    fontSize: tokens.fontSizeL,
    marginBottom: tokens.spacingS
  }),
  description: css({
    fontSize: tokens.fontSizeM,
    marginBottom: tokens.spacingS
  })
};

const AppsFrameworkIntroBanner = () => (
  <Card className={styles.flexContainer} padding="large">
    <div>
      <Heading className={styles.heading}>Introducing Contentful Apps</Heading>
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
            fromState: getCurrentStateName()
          })
        }
        target="_blank"
        rel="noopener noreferrer"
        href="https://www.contentful.com/developers/docs/extensibility/app-framework/">
        Learn how to build your own app
      </Button>
    </div>
    <div className={styles.illustrationContainer}>
      <ConnectWithAppIllustration className={styles.svgContainerExtension} />
    </div>
  </Card>
);

export default AppsFrameworkIntroBanner;
