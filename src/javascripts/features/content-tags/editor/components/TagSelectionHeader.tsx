import { Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { FeedbackButton } from 'core/feature-feedback';
import { css } from 'emotion';
import { NoTagsContainer } from 'features/content-tags/core/components/NoTagsContainer';
import { useCanManageTags, useReadTags } from 'features/content-tags/core/hooks';
import { TAGS_PER_ENTITY } from 'features/content-tags/core/limits';
import PropTypes from 'prop-types';
import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { router } from 'core/react-routing';

const styles = {
  wrapper: css({
    display: 'flex',
    justifyContent: 'space-between',
  }),
  iconWrapper: css({
    marginLeft: tokens.spacingL,
    order: 2,
  }),
  tagLimits: css({
    marginLeft: 'auto',
  }),
  tooltipWrapper: css({
    width: '100%',
  }),
};

const TagSelectionHeader = ({ totalSelected }) => {
  const { isLoading, hasTags } = useReadTags();
  const canManageTags = useCanManageTags();
  const onCreate = useCallback(() => {
    if (canManageTags) {
      router.navigate({ path: 'tags' });
    }
  }, [canManageTags]);

  const renderNoTags = useMemo(() => {
    return (
      <React.Fragment>
        <NoTagsContainer onCreate={onCreate} buttonLabel={'Add tags'} />
      </React.Fragment>
    );
  }, [onCreate]);

  if (!hasTags && !isLoading) {
    return renderNoTags;
  }

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
