import { TagSorting } from 'features/content-tags/management/components/TagSorting';
import { TagTypeFilter } from 'features/content-tags/management/components/TagTypeFilter';
import React, { useMemo } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { TAGS_PER_SPACE } from 'features/content-tags/core/limits';
import { LimitsReachedNote } from 'features/content-tags/management/components/LimitsReachedNote';
import { useFilteredTags, useReadTags } from 'features/content-tags/core/hooks';
import PropTypes from 'prop-types';

const styles = {
  flexContainer: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingL,
  }),
};

const TagListHeader = ({ contentLevelPermissionsEnabled }) => {
  const { total } = useReadTags();
  const { setSorting, setTypeFilter } = useFilteredTags();

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
        {contentLevelPermissionsEnabled && <TagTypeFilter onChange={setTypeFilter} />}
      </div>
    </>
  );
};

TagListHeader.propTypes = {
  contentLevelPermissionsEnabled: PropTypes.bool,
};

export { TagListHeader };
