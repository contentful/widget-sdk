import { TagSorting } from 'features/content-tags/management/components/TagSorting';
import { TagVisibilityFilter } from 'features/content-tags/management/components/TagVisibilityFilter';
import React, { useMemo } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { TAGS_PER_SPACE } from 'features/content-tags/core/limits';
import { LimitsReachedNote } from 'features/content-tags/management/components/LimitsReachedNote';
import { useFilteredTags, useReadTags } from 'features/content-tags/core/hooks';

const styles = {
  flexContainer: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingL,
  }),
};

const TagListHeader = () => {
  const { total } = useReadTags();
  const { setSorting, setVisibility } = useFilteredTags();

  const limitNote = useMemo(() => {
    if (total >= TAGS_PER_SPACE) {
      return <LimitsReachedNote />;
    }
    return null;
  }, [total]);

  return (
    <>
      <div className={styles.flexContainer}>{limitNote}</div>
      <div className={styles.flexContainer}>
        <TagSorting onChange={setSorting} />
        <TagVisibilityFilter onChange={setVisibility} />
      </div>
    </>
  );
};

TagListHeader.propTypes = {};

export { TagListHeader };
