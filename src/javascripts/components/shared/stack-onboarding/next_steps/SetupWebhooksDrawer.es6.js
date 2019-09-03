import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Paragraph, Button, TextLink } from '@contentful/forma-36-react-components';
import { trackClickCTA } from 'app/home/tracking.es6';

const styles = {
  flexContainer: css({ display: 'flex', justifyContent: 'space-between' }),
  textColumn: css({ width: '493px' }),
  image: css({
    width: '266px',
    height: '201px',
    backgroundSize: '266px 201px',
    marginRight: tokens.spacingXl
  })
};

const SetupWebhooksDrawer = props => {
  const { deploymentProvider } = props;
  const url = `https://www.contentful.com/developers/docs/tutorials/general/automate-site-builds-with-webhooks/#${deploymentProvider}`;

  return (
    <div className={styles.flexContainer}>
      <div className={styles.textColumn}>
        <Paragraph>
          You can automate the rebuilds of the blog by setting up webhooks that trigger when you
          publish or unpublish content in this space.
        </Paragraph>
        {deploymentProvider === 'netlify' ? <NetlifyPrerequisite /> : <HerokuPrerequisite />}
        <Button
          onClick={() => trackClickCTA('webhook_guide_link')}
          className="f36-margin-top--m"
          target="_blank"
          href={url}>
          View webhook guide
        </Button>
      </div>
      <div
        role="img"
        aria-label="View of the Webhook Guide"
        className={cx(styles.image, 'background-image_webhook-guide')}
      />
    </div>
  );
};

const NetlifyPrerequisite = () => {
  return (
    <>
      <h5>Prerequisites for Netlify</h5>
      <Paragraph>
        Your site must already be deployed to Netlify, and you must have configured it for
        continuous deployment by connecting it to a remote Git repo. If you haven’t done so already,
        follow the guide on the{' '}
        <TextLink href="https://www.netlify.com/docs/continuous-deployment/" target="_blank">
          Netlify documentation
        </TextLink>
        .
      </Paragraph>
    </>
  );
};

const HerokuPrerequisite = () => {
  return (
    <>
      <h5>Prerequisites for Heroku</h5>
      <Paragraph>
        You must have an account with CircleCI and your site must already be deployed to Heroku. You
        should also have a remote Git repo configured for your project hosted on either Github,
        GitLab, or Bitbucket. For our purposes, we’ll assume the project is hosted on Github.
      </Paragraph>
    </>
  );
};

SetupWebhooksDrawer.propTypes = {
  deploymentProvider: PropTypes.string.isRequired
};

export default SetupWebhooksDrawer;
