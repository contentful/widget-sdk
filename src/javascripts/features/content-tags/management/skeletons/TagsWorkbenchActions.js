import * as React from 'react';
import { useCallback } from 'react';
import { Button, TextInput } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { useReadTags } from 'features/content-tags/core/hooks';
import PropTypes from 'prop-types';

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
};

function TagsWorkbenchActions({ hasData, onCreate }) {
  const { search, setSearch, setSkip } = useReadTags();

  const onSearch = useCallback(
    (event) => {
      setSkip(0);
      setSearch(event.target.value);
    },
    [setSearch, setSkip]
  );

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
            <Button onClick={onCreate} buttonType="primary" testId="tags.add">
              Create Tag
            </Button>
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
