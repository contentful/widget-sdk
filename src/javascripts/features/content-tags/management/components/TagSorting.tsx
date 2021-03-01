import React, { useCallback, useState } from 'react';
import { FilterPill } from 'features/entity-search';
import { ORDER_TAG } from 'features/content-tags/core/state/tags-sorting';

const OPTIONS = [
  { label: 'Newest', value: ORDER_TAG.DESC },
  { label: 'Oldest', value: ORDER_TAG.ASC },
  { label: 'Tag name A → Z', value: ORDER_TAG.nameASC },
  { label: 'Tag name Z → A', value: ORDER_TAG.nameDESC },
  { label: 'Tag ID A → Z', value: ORDER_TAG.idASC },
  { label: 'Tag ID Z → A', value: ORDER_TAG.idDESC },
];

type TagSortingProps = {
  onChange: (value: typeof ORDER_TAG[keyof typeof ORDER_TAG]) => void;
};

export function TagSorting({ onChange }: TagSortingProps) {
  const [selectedSorting, setSelectedSorting] = useState(OPTIONS[0].value);

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
        queryKey: 'tags',
        value: selectedSorting,
        filterType: 'select',
        options: OPTIONS,
      }}
    />
  );
}
