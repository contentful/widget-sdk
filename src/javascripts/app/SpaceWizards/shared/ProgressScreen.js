import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  Heading,
  Paragraph,
  Typography,
  Spinner,
  Button,
  Subheading,
} from '@contentful/forma-36-react-components';

import CheckmarkIcon from 'svg/checkmark.svg';
import ContentTypeIcon from 'svg/page-ct.svg';
import ContentIcon from 'svg/page-content.svg';
import MediaIcon from 'svg/page-media.svg';
import APIsIcon from 'svg/page-apis.svg';

const styles = {
  checkmarkIcon: css({
    transform: 'scale(2)',
  }),
  center: css({
    textAlign: 'center',
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
    <Typography>
      <div className="create-new-space__templates__status">
        {!done && <Spinner testId="create-space-progress" size="large" />}
        {done && (
          <div className={styles.checkmarkIcon} data-test-id="create-space-done">
            <CheckmarkIcon />
          </div>
        )}
      </div>
      <Heading>Hang on, we’re preparing your space</Heading>
      <Paragraph>
        In the meantime, let us quickly explain the kind of things you’ll find in your space
      </Paragraph>
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
    </Typography>
  );
}

ProgressScreen.propTypes = {
  done: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
};