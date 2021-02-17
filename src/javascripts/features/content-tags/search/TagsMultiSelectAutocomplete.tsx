import React, { useRef, useState } from 'react';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

import { TagOption } from '../types';
import { Keys } from 'features/entity-search';
import { SelectTagsModal } from 'features/content-tags/core/components/SelectTagsModal';
import { FilteredTagsProvider } from 'features/content-tags/core/state/FilteredTagsProvider';
import { Conditional } from 'features/content-tags/core/components/Conditional';

const summarizeTags = (tags: TagOption[]) => {
  if (!Array.isArray(tags) || tags.length === 0) {
    return '';
  }

  if (tags.length === 1) {
    return tags[0].label;
  }

  return `${tags[0].label} and ${tags.length - 1} more`;
};

function shouldOpenSelector(event: React.KeyboardEvent) {
  return Keys.arrowDown(event) || Keys.enter(event) || Keys.space(event);
}

const defaultStyles = {
  Autocomplete: css({
    marginTop: tokens.spacingS,
    marginBottom: tokens.spacingM,
  }),
  TagSummary: css({
    marginLeft: tokens.spacingS,
    marginRight: tokens.spacingS,
    minWidth: 76,
    height: '100%',
  }),
  DropdownCheckboxField: css({
    '& span': {
      marginLeft: tokens.spacingXs,
      fontWeight: tokens.fontWeightDemiBold,
    },
  }),
};

type TagsMultiSelectAutocompleteProps = {
  tags: TagOption[];
  selectedTags: TagOption[];
  onChange: (tags: TagOption[]) => void;
  onQueryChange: (query: string) => void;
  setIsRemovable: (removable: boolean) => void;
  styles?: Partial<typeof defaultStyles>;
  isFocused?: boolean;
};

const TagsMultiSelectAutocomplete = ({
  tags,
  onChange,
  onQueryChange,
  selectedTags,
  setIsRemovable,
  styles = {},
  isFocused,
}: TagsMultiSelectAutocompleteProps) => {
  const [isSearching, setIsSearching] = useState<boolean>(isFocused ?? false);
  const tagsRef = useRef<HTMLDivElement | null>(null);

  setIsRemovable(!isSearching);

  const onClose = ({ canceled, tags: newTagsSelection }) => {
    if (!canceled) {
      onChange(tags.filter((tag) => newTagsSelection.includes(tag.value)));
    }
    onQueryChange('');
    setIsSearching(false);
    setIsRemovable(true);
  };

  const handleSummaryKeyDown = (event: React.KeyboardEvent) => {
    if (shouldOpenSelector(event)) {
      setIsSearching(true);
    }
  };

  return (
    <>
      <div
        ref={tagsRef}
        onKeyDown={handleSummaryKeyDown}
        tabIndex={0}
        className={css(defaultStyles.TagSummary, styles.TagSummary)}
        onFocus={() => setIsSearching(true)}
        onClick={() => setIsSearching(true)}>
        {summarizeTags(selectedTags)}
      </div>
      <Conditional condition={isSearching}>
        <FilteredTagsProvider>
          <SelectTagsModal
            hasInlineTagCreation={false}
            selectedTags={selectedTags}
            isShown={true}
            onClose={onClose}
            modalProps={{
              title: 'Filter by tags',
              submitLabel: 'Apply',
            }}
          />
        </FilteredTagsProvider>
      </Conditional>
    </>
  );
};

export { TagsMultiSelectAutocomplete };
