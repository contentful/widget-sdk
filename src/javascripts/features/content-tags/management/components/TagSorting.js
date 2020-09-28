import { FilterValueInputs } from 'core/services/ContentQuery';
import { FilterPill } from 'features/entity-search';
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { ORDER_TAG } from 'features/content-tags/core/state/tags-sorting';

const OPTIONS = [
  [ORDER_TAG.DESC, 'Newest'],
  [ORDER_TAG.ASC, 'Oldest'],
  [ORDER_TAG.nameASC, 'Tag name A → Z'],
  [ORDER_TAG.nameDESC, 'Tag name Z → A'],
  [ORDER_TAG.idASC, 'Tag ID A → Z'],
  [ORDER_TAG.idDESC, 'Tag ID Z → A'],
];

const TagSorting = ({ onChange }) => {
  const [selectedSorting, setSelectedSorting] = useState(OPTIONS[0][0]);

  const onChangeHandler = useCallback(
    (selectedType) => {
      setSelectedSorting(selectedType);
      if (onChange) {
        onChange(selectedType);
      }
    },
    [onChange, setSelectedSorting]
  );
  return (
    <FilterPill
      onChange={onChangeHandler}
      filter={{
        label: 'Sort by',
        valueInput: FilterValueInputs.Select(OPTIONS),
      }}
      value={selectedSorting}
    />
  );
};

TagSorting.propTypes = {
  onChange: PropTypes.func,
};

export { TagSorting };
