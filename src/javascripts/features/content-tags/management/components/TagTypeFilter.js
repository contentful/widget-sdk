import { FilterValueInputs as ValueInput } from 'core/services/ContentQuery';
import { FilterPill } from 'features/entity-search';
import React, { useCallback, useState } from 'react';
import { TagTypeAny, TagTypeFilters } from 'features/content-tags/core/TagType';
import PropTypes from 'prop-types';
import { css } from 'emotion';

const styles = {
  filterContainer: css({
    '.search__select-value': {
      paddingRight: '0px',
    },
  }),
};

const TagTypeFilter = ({ onChange }) => {
  const [selectedTagType, setSelectedTagType] = useState(TagTypeAny);

  const onChangeHandler = useCallback(
    (selectedType) => {
      setSelectedTagType(selectedType);
      if (onChange) {
        onChange(selectedType);
      }
    },
    [onChange, setSelectedTagType]
  );

  return (
    <FilterPill
      className={styles.filterContainer}
      onChange={onChangeHandler}
      filter={{
        label: 'Type',
        valueInput: ValueInput.Select(TagTypeFilters.map((type) => [type, type])),
      }}
      value={selectedTagType}
    />
  );
};

TagTypeFilter.propTypes = {
  onChange: PropTypes.func,
};

export { TagTypeFilter };
