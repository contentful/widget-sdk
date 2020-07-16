import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { Button, TextInput, Tooltip } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { useReadTags } from 'features/content-tags/core/hooks';
import PropTypes from 'prop-types';
import { TagsFeedbackLink } from 'features/content-tags/core/components/TagsFeedbackLink';
import { TAGS_PER_SPACE } from 'features/content-tags/core/limits';

const styles = {
  search: css({
    maxWidth: '1100px',
    marginLeft: '79px',
    paddingLeft: tokens.spacingL,
  }),
  actionsWrapper: css({
    width: '100%',
    display: 'flex',
  }),
  ctaWrapper: css({
    paddingLeft: tokens.spacingL,
    marginLeft: 'auto',
    display: 'flex',
  }),
  feedback: css({
    flexGrow: '',
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacingXl,
    marginLeft: tokens.spacing3Xl,
    minWidth: '120px',
  }),
};

function TagsWorkbenchActions({ hasData, onCreate }) {
  const { search, setSearch, setSkip, total } = useReadTags();

  const onSearch = useCallback(
    (event) => {
      setSkip(0);
      setSearch(event.target.value);
    },
    [setSearch, setSkip]
  );

  const createButton = useMemo(() => {
    const button = (
      <Button
        onClick={onCreate}
        disabled={total >= TAGS_PER_SPACE}
        buttonType="primary"
        testId="tags.add">
        Create Tag
      </Button>
    );

    if (total >= TAGS_PER_SPACE) {
      return (
        <Tooltip
          content="You've reached the limit for the number of tags in this space"
          id="createTip"
          maxWidth={180}
          place="top">
          {button}
        </Tooltip>
      );
    }
    return button;
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
