import PropTypes from 'prop-types';
import { Paragraph } from '@contentful/forma-36-react-components';
import { TAGS_PER_ENTITY } from 'features/content-tags/core/limits';
import FeedbackButton from 'app/common/FeedbackButton';
import * as React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  wrapper: css({
    display: 'flex',
    justifyContent: 'space-between',
  }),
  iconWrapper: css({
    marginLeft: tokens.spacingL,
    order: '2',
  }),
  tagLimits: css({
    marginLeft: 'auto',
  }),
  tooltipWrapper: css({
    width: '100%',
  }),
};

const TagSelectionHeader = ({ totalSelected }) => {
  return (
    <div className={styles.wrapper}>
      <Paragraph>
        {totalSelected} / {TAGS_PER_ENTITY}
      </Paragraph>
      <Paragraph>
        <FeedbackButton about="Tags" target="devWorkflows" label="Give feedback" />
      </Paragraph>
    </div>
  );
};

TagSelectionHeader.propTypes = {
  totalSelected: PropTypes.number,
};

export { TagSelectionHeader };
