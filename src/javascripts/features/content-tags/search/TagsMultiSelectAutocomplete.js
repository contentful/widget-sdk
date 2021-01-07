import React, { useEffect } from 'react';
import { useState, useRef } from 'react';
import CheckboxField from '@contentful/forma-36-react-components/dist/components/CheckboxField';
import { Autocomplete } from '@contentful/forma-36-react-components/dist/alpha';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { summarizeTags } from '../editor/utils';
import keycodes from 'utils/keycodes';

function shouldOpenSelector({ keyCode }) {
  return keyCode === keycodes.DOWN || keyCode === keycodes.ENTER || keyCode === keycodes.SPACE;
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

function addOrRemoveTag(currentList, addedOrRemovedTag) {
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
}) => {
  const [isSearching, setIsSearching] = useState(isFocused);
  const [currentTags, setCurrentTags] = useState(selectedTags);
  const tagsRef = useRef();

  setIsRemovable(!isSearching);

  const onSelectedTagChange = (tag) => {
    setCurrentTags((currentTagsState) => addOrRemoveTag(currentTagsState, tag));
  };

  useEffect(() => {
    onChange(currentTags);
  }, [currentTags, onChange]);

  // Like a checkbox, but don't actually bother reporting events! The whole area triggers the event on click
  // and the event toggles tags, so two events == the opposite)
  const tagSelectRow = (tag) => (
    <CheckboxField
      className={styles.DropdownCheckboxField}
      key={tag.value}
      id={tag.value}
      labelText={tag.label}
      formLabelProps={{
        onClick: (evt) => {
          evt.preventDefault();
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

  const handleSummaryKeyDown = ({ keyCode }) => {
    if (shouldOpenSelector({ keyCode })) {
      setIsSearching(true);
    }
  };

  const handleSearchKeyDown = ({ keyCode }) => {
    if (keyCode === keycodes.TAB) {
      onClose();
    }
  };

  return (
    <>
      <div
        ref={tagsRef}
        onKeyDown={handleSummaryKeyDown}
        tabIndex="0"
        className={css(defaultStyles.TagSummary, styles.TagSummary)}
        onFocus={() => setIsSearching(true)}
        onClick={() => setIsSearching(true)}>
        {summarizeTags(selectedTags)}
      </div>
      {isSearching && (
        <span onKeyDown={handleSearchKeyDown}>
          <Autocomplete
            items={sortedTags}
            width={'full'}
            onChange={onSelectedTagChange}
            willClearQueryOnClose={true}
            willUpdateOnSelect={false}
            takeFocus={true}
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
            }}
            className={css(defaultStyles.Autocomplete, styles.Autocomplete)}>
            {(options) => options.map(tagSelectRow)}
          </Autocomplete>
        </span>
      )}
    </>
  );
};

TagsMultiSelectAutocomplete.propTypes = {
  tags: PropTypes.array.isRequired,
  selectedTags: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  setIsRemovable: PropTypes.func.isRequired,
  maxHeight: PropTypes.number.isRequired,
  styles: PropTypes.object,
  isFocused: PropTypes.bool,
};

export { TagsMultiSelectAutocomplete };
