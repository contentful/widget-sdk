import React, { useCallback, useState } from 'react';
import { FilterPill } from 'features/entity-search';
import { TagVisibilityOption } from 'features/content-tags/types';
import { TAG_VISILBILITY_OPTIONS } from 'features/content-tags/core/state/tags-filter';

const VISIBILITY_FILTER_OPTIONS = [
  { label: 'Any', value: TAG_VISILBILITY_OPTIONS.ANY },
  { label: 'Private', value: TAG_VISILBILITY_OPTIONS.PRIVATE },
  { label: 'Public', value: TAG_VISILBILITY_OPTIONS.PUBLIC },
];

type Props = { onChange: (value: TagVisibilityOption) => void };

const TagVisibilityFilter: React.FC<Props> = ({ onChange }) => {
  const [selectedVisibility, setSelectedVisibility] = useState(VISIBILITY_FILTER_OPTIONS[0].value);

  const onChangeHandler = useCallback(
    (selectedOption) => {
      setSelectedVisibility(selectedOption);
      if (onChange) {
        onChange(selectedOption);
      }
    },
    [onChange]
  );

  return (
    <FilterPill
      testId="tag-visibility-filter"
      onChange={onChangeHandler}
      filter={{
        label: 'Visibility',
        queryKey: 'tags',
        value: selectedVisibility,
        filterType: 'select',
        options: VISIBILITY_FILTER_OPTIONS,
      }}
    />
  );
};

export { TagVisibilityFilter };
