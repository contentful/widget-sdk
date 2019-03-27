import React from 'react';
import { css } from 'emotion';
import { spacingL, spacingXl } from '@contentful/forma-36-tokens';
import { Note } from '@contentful/forma-36-react-components';
import FeedbackButton from 'app/common/FeedbackButton.es6';

const styles = {
  note: css({ display: 'inline-flex', marginBottom: spacingL, marginLeft: spacingXl }),
  message: css({ marginRight: '1rem' })
};

const ExperimentalFeatureNote = () => (
  <Note className={styles.note}>
    <span className={styles.message}>
      This is a new feature. We&apos;re still working on it and we&apos;d love to hear your
      thoughts.
    </span>
    <FeedbackButton target="bizVel" about="Teams" />
  </Note>
);

export default ExperimentalFeatureNote;
