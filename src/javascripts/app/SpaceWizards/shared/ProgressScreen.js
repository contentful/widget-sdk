import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  Heading,
  Paragraph,
  Spinner,
  Button,
  Subheading,
  Typography,
} from '@contentful/forma-36-react-components';

import CheckmarkIcon from 'svg/checkmark.svg';
import ContentTypeIcon from 'svg/page-ct.svg';
import ContentIcon from 'svg/page-content.svg';
import MediaIcon from 'svg/page-media.svg';
import APIsIcon from 'svg/page-apis.svg';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  checkmarkIcon: css({
    transform: 'scale(2)',
  }),
  loadingIndicator: css({
    marginBottom: '20px',
  }),
  center: css({
    textAlign: 'center',
    marginBottom: tokens.spacingL,
  }),
};

const infoItems = [
  {
    Icon: ContentTypeIcon,
    title: 'Content model',
    description:
      'The content model is comprised of content types, they work like a stencil which defines the structure of entries. We’re creating a few different content types for you to see how it works.',
  },
  {
    Icon: ContentIcon,
    title: 'Content',
    description:
      'Your content is made up of entries. The space will include a couple of entries based on the content types mentioned above.',
  },
  {
    Icon: MediaIcon,
    title: 'Media',
    description:
      'Your media consists of assets, which are external files, from images or videos to documents. Your entries will have a few assets to complement them.',
  },
  {
    Icon: APIsIcon,
    title: 'API keys',
    description:
      'An API key is the token that you’ll use to retrieve your content. We created a few API keys so that you can get started fetching your content right away.',
  },
];

export default function ProgressScreen(props) {
  const { done, onConfirm } = props;

  return (
    <div>
      <div className={styles.center}>
        <div className={styles.loadingIndicator}>
          {!done && <Spinner testId="create-template-progress" size="large" />}
          {done && (
            <div className={styles.checkmarkIcon} data-test-id="create-template-done">
              <CheckmarkIcon />
            </div>
          )}
        </div>
        <Typography>
          <Heading>Hang on, we’re preparing your space</Heading>
        </Typography>
        <Paragraph>
          In the meantime, let us quickly explain the kind of things you’ll find in your space
        </Paragraph>
      </div>
      <div className="create-new-space__templates__entities">
        {infoItems.map(({ Icon, title, description }) => (
          <div key={title} className="create-new-space__templates__entity">
            <div>
              <Icon />
            </div>
            <div className="create-new-space__templates__entity__description">
              <Subheading>{title}</Subheading>
              <Paragraph>{description}</Paragraph>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.center}>
        <Button disabled={!done} loading={!done} onClick={onConfirm} testId="get-started-button">
          Get started
        </Button>
      </div>
    </div>
  );
}

ProgressScreen.propTypes = {
  done: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
