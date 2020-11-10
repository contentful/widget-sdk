import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { Button, Paragraph, TextInput, Tooltip } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { useFilteredTags, useReadTags } from 'features/content-tags/core/hooks';
import PropTypes from 'prop-types';
import { TagsFeedbackLink } from 'features/content-tags/core/components/TagsFeedbackLink';
import { TAGS_PER_SPACE } from 'features/content-tags/core/limits';
import { ConditionalWrapper } from 'features/content-tags/core/components/ConditionalWrapper';

const styles = {
  search: css({
    maxWidth: '1100px',
    marginLeft: '79px',
    paddingLeft: tokens.spacingL,
  }),
  actionsWrapper: css({
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
  }),
  ctaWrapper: css({
    display: 'flex',
  }),
  tagLimits: css({
    alignItems: 'center',
    height: '100%',
    marginRight: tokens.spacingL,
    width: 'auto',
    display: 'flex',
    flexGrow: '',
  }),
  feedback: css({
    alignSelf: 'flex-start',
    flexGrow: '',
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    marginRight: tokens.spacingXl,
    marginLeft: tokens.spacingXl,
    minWidth: '120px',
  }),
};

function TagsWorkbenchActions({ hasData, onCreate }) {
  const { total } = useReadTags();
  const { search, setSearch, setSkip } = useFilteredTags();

  const onSearch = useCallback(
    (event) => {
      setSkip(0);
      setSearch(event.target.value);
    },
    [setSearch, setSkip]
  );

  const createButton = useMemo(() => {
    return (
      <ConditionalWrapper
        condition={total >= TAGS_PER_SPACE}
        wrapper={(children) => (
          <Tooltip
            content="You've reached the limit for the number of tags in this space"
            id="createTip"
            maxWidth={180}
            place="top">
            {children}
          </Tooltip>
        )}>
        <Button
          onClick={() => {
            onCreate();
          }}
          disabled={total >= TAGS_PER_SPACE}
          buttonType="primary"
          testId="tags.add">
          Create Tag
        </Button>
      </ConditionalWrapper>
    );
  }, [total, onCreate]);

  return (
    <div className={styles.actionsWrapper}>
      {hasData && (
        <>
          <TextInput
            className={styles.search}
            autoFocus
            type="search"
            placeholder="Search for tags"
            onChange={onSearch}
            value={search}
          />
          <div className={styles.ctaWrapper}>
            <div className={styles.feedback}>
              <TagsFeedbackLink label="Give feedback" />
            </div>
            <Paragraph className={styles.tagLimits}>
              {total}&nbsp;/&nbsp;{TAGS_PER_SPACE}
            </Paragraph>
            {createButton}
          </div>
        </>
      )}
    </div>
  );
}

TagsWorkbenchActions.propTypes = {
  hasData: PropTypes.bool,
  onCreate: PropTypes.func,
};

export { TagsWorkbenchActions };
