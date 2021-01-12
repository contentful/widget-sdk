import React, { useEffect, useRef, useState } from 'react';

import CheckboxField from '@contentful/forma-36-react-components/dist/components/CheckboxField';
import { Autocomplete } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';

import { FilterOption } from '../core/Types';
import { Keys } from 'features/entity-search';
const summarizeTags = (tags: FilterOption[]) => {
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
  DropdownCheckboxField: css({ width: '100%' }),
};

type TagsMultiSelectAutocompleteProps = {
  tags: FilterOption[];
  selectedTags: FilterOption[];
  onChange: (tags: FilterOption[]) => void;
  onQueryChange: (query: string) => void;
  setIsRemovable: (removable: boolean) => void;
  maxHeight: number;
  styles?: Partial<typeof defaultStyles>;
  isFocused?: boolean;
};

function addOrRemoveTag(currentList: FilterOption[], addedOrRemovedTag: FilterOption) {
  if (currentList.some(({ value }) => value === addedOrRemovedTag.value)) {
    // remove
    return currentList.filter(({ value }) => value !== addedOrRemovedTag.value);
  }

  // add
  return [...currentList, addedOrRemovedTag];
}

const TagsMultiSelectAutocomplete = ({
  tags,
  onChange,
  onQueryChange,
  selectedTags,
  setIsRemovable,
  maxHeight,
  styles = {},
  isFocused,
}: TagsMultiSelectAutocompleteProps) => {
  const [isSearching, setIsSearching] = useState<boolean>(isFocused ?? false);
  const [currentTags, setCurrentTags] = useState(selectedTags);
  const tagsRef = useRef<HTMLDivElement>(null);

  setIsRemovable(!isSearching);

  useEffect(() => {
    onChange(currentTags);
  }, [currentTags, onChange]);

  const onSelectedTagChange = (tag: FilterOption) => {
    setCurrentTags((currentTagsState) => addOrRemoveTag(currentTagsState, tag));
  };

  // Like a checkbox, but don't actually bother reporting events! The whole area triggers the event on click
  // and the event toggles tags, so two events == the opposite)
  const tagSelectRow = (tag: FilterOption) => (
    <CheckboxField
      className={styles.DropdownCheckboxField}
      key={tag.value}
      id={tag.value}
      labelText={tag.label}
      formLabelProps={{
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          event.preventDefault();
        },
      }}
      onChange={(evt) => {
        evt.stopPropagation();
      }}
      checked={currentTags.some((selectedTag) => selectedTag.value === tag.value)}
    />
  );

  // Previously checked tags are displayed first. Tags checked in this session
  // remain in place until blur and onChange()
  // NB The order of items={} must match the order of {(options)=>{}}
  const sortedTags = [
    ...tags.filter((tag) => selectedTags.some((selectedTag) => selectedTag.value === tag.value)),
    ...tags.filter((tag) => !selectedTags.some((selectedTag) => selectedTag.value === tag.value)),
  ];

  const onClose = () => {
    onQueryChange('');
    setIsSearching(false);
    setIsRemovable(true);
  };

  const handleSummaryKeyDown = (event: React.KeyboardEvent) => {
    if (shouldOpenSelector(event)) {
      setIsSearching(true);
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (Keys.tab(event)) {
      onClose();
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
      {isSearching && (
        <span onKeyDown={handleSearchKeyDown}>
          <Autocomplete<FilterOption>
            items={sortedTags}
            width={'full'}
            onChange={onSelectedTagChange}
            willClearQueryOnClose={true}
            onQueryChange={onQueryChange}
            maxHeight={maxHeight}
            placeholder={'Search for tags'}
            emptyListMessage={'No tags found'}
            noMatchesMessage={'No tags found'}
            dropdownProps={{
              // input of autocomplete disappears if we use portal
              usePortal: false,
              nonClosingRefs: [tagsRef],
              isFullWidth: true,
              isOpen: true,
              isAutoalignmentEnabled: false,
              position: 'bottom-left',
              dropdownContainerClassName: 'tag-search-container',
              onClose,
              children: null,
            }}
            className={css(defaultStyles.Autocomplete, styles.Autocomplete)}>
            {(options) => options.map(tagSelectRow)}
          </Autocomplete>
        </span>
      )}
    </>
  );
};

export { TagsMultiSelectAutocomplete };
