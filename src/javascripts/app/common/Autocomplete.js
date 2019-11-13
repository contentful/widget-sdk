import React, { useReducer, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import isHotKey from 'is-hotkey';
import {
  TextInput,
  Dropdown,
  DropdownList,
  DropdownListItem,
  SkeletonBodyText,
  SkeletonContainer,
  ValidationMessage,
  IconButton
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';

const TOGGLED_LIST = 'TOGGLED_LIST';
const NAVIGATED_ITEMS = 'NAVIGATED_ITEMS';
const QUERY_CHANGED = 'QUERY_CHANGED';
const ITEM_SELECTED = 'ITEM_SELECTED';

const directions = {
  DOWN: 1,
  UP: -1
};

const initialState = {
  isOpen: false,
  query: '',
  highlightedItemIndex: null
};

const reducer = (state, action) => {
  switch (action.type) {
    case TOGGLED_LIST:
      return {
        ...state,
        isOpen: action.payload,
        highlightedItemIndex: null
      };
    case NAVIGATED_ITEMS:
      return {
        ...state,
        isOpen: true,
        highlightedItemIndex: action.payload
      };
    case QUERY_CHANGED:
      return {
        ...state,
        highlightedItemIndex: null,
        isOpen: true,
        query: action.payload
      };
    case ITEM_SELECTED:
      return { ...initialState };
  }
};

const styles = {
  autocompleteInput: css({
    display: 'flex',
    'input::-webkit-search-cancel-button': { display: 'none' },
    'input::-ms-clear': { display: 'none' }
  }),
  inputIconButton: css({
    position: 'absolute',
    right: 'calc(1rem * (12 / 16))',
    top: '50%',
    marginTop: -10,
    zIndex: 1
  })
};

/**
 * This component renders an input field and a dropdown list with the options
 * As a user of this component, you are responsible for passing in the list of options, always.
 * The component itself will not filter or make requests, but rather fire callbacks when
 * something changes.
 *
 * @param {Array} items The options to be displayed in the dropdown
 * @param {Function} children A function that receives the list of options and should return a map of HTML nodes or components
 * @param {Function} onChange A function that will be called when an item is selected from the dropdown
 * @param {Function} onQueryChange A function that will be called when the text input value changed. Use this to make requests of filter the list of items
 * @param {String} placeholder A placeholder to be displayed in the text input
 * @param {String} width Use 'small', 'medium', 'large' or 'full' to set the width of the text input
 */

export default function Autocomplete({
  items = [],
  disabled = false,
  children,
  onChange,
  onQueryChange,
  placeholder = 'Search',
  width,
  className,
  maxHeight,
  validationMessage,
  isLoading = false,
  emptyListMessage = 'No options to choose from',
  noMatchesMessage = 'No items found',
  dropdownProps,
  willClearQueryOnClose = false
}) {
  const listRef = useRef();
  const inputRef = useRef();
  const [{ isOpen, query, highlightedItemIndex }, dispatch] = useReducer(reducer, initialState);

  const toggleList = isOpen => dispatch({ type: TOGGLED_LIST, payload: isOpen });

  const selectItem = item => {
    dispatch({ type: ITEM_SELECTED });
    onQueryChange('');
    onChange(item);
  };

  const updateQuery = value => {
    dispatch({ type: QUERY_CHANGED, payload: value });
    onQueryChange(value);
  };

  const handleKeyDown = event => {
    const isEnter = isHotKey('enter', event);
    const isTab = isHotKey('tab', event) || isHotKey('shift+tab', event);
    const hasSelection = highlightedItemIndex !== null;
    const lastIndex = items.length ? items.length - 1 : 0;
    const direction = getNavigationDirection(event);

    if (direction) {
      const newIndex = getNewIndex(highlightedItemIndex, direction, lastIndex);
      scrollToItem(listRef.current, newIndex);
      dispatch({ type: NAVIGATED_ITEMS, payload: newIndex });
    }

    if (isEnter && hasSelection) {
      const selected = items[highlightedItemIndex];
      selectItem(selected);
    }

    if (isTab) {
      toggleList(false);
    }
  };

  const handleButtonClick = () => {
    query ? updateQuery('') : toggleList();
    inputRef.current.focus();
  };

  // Gets the result of the children function and creates a list with components and option objects
  const options = useMemo(
    () => children(items).map((child, index) => ({ child, option: items[index] })),
    [children, items]
  );

  return (
    <>
      <Dropdown
        isOpen={isOpen}
        onClose={() => {
          willClearQueryOnClose && updateQuery('');
          dispatch({ type: TOGGLED_LIST });
        }}
        className={className}
        toggleElement={
          <div className={styles.autocompleteInput}>
            <TextInput
              className={className}
              value={query}
              onChange={e => updateQuery(e.target.value)}
              onFocus={() => toggleList(true)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              width={width}
              inputRef={inputRef}
              testId="autocomplete.input"
              type="search"
            />
            <IconButton
              className={styles.inputIconButton}
              tabIndex="-1"
              buttonType="muted"
              iconProps={{ icon: query ? 'Close' : 'ChevronDown' }}
              onClick={handleButtonClick}
              label={query ? 'Clear' : 'Show list'}
            />
          </div>
        }
        {...dropdownProps}>
        {validationMessage && <ValidationMessage>{validationMessage}</ValidationMessage>}
        <DropdownList testId="autocomplete.dropdown-list" maxHeight={maxHeight}>
          <div ref={listRef}>
            {!options.length && !isLoading && (
              <DropdownListItem isDisabled testId="autocomplete.empty-list-message">
                {query ? noMatchesMessage : emptyListMessage}
              </DropdownListItem>
            )}
            {isLoading ? (
              <OptionSkeleton />
            ) : (
              options.map(({ child, option }, index) => {
                const isActive = index === highlightedItemIndex;
                return (
                  <DropdownListItem
                    key={index}
                    isActive={isActive}
                    data-selected={isActive} // this should be coming from the component library
                    onClick={() => selectItem(option)}
                    testId="autocomplete.dropdown-list-item">
                    {child}
                  </DropdownListItem>
                );
              })
            )}
          </div>
        </DropdownList>
      </Dropdown>
    </>
  );
}

Autocomplete.propTypes = {
  items: PropTypes.array.isRequired,
  children: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  width: PropTypes.string,
  className: PropTypes.string,
  maxHeight: PropTypes.number,
  validationMessage: PropTypes.string,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  emptyListMessage: PropTypes.string,
  noMatchesMessage: PropTypes.string,
  dropdownProps: PropTypes.object,
  willClearQueryOnClose: PropTypes.bool
};

function OptionSkeleton() {
  return (
    <>
      <DropdownListItem>
        <SkeletonContainer svgWidth="200" svgHeight={20}>
          <SkeletonBodyText numberOfLines={1} />
        </SkeletonContainer>
      </DropdownListItem>
      <DropdownListItem>
        <SkeletonContainer svgWidth="100" svgHeight={20}>
          <SkeletonBodyText numberOfLines={1} />
        </SkeletonContainer>
      </DropdownListItem>
      <DropdownListItem>
        <SkeletonContainer svgWidth="150" svgHeight={20}>
          <SkeletonBodyText numberOfLines={1} />
        </SkeletonContainer>
      </DropdownListItem>
    </>
  );
}

// Get the navigation direction based on keyboard events
function getNavigationDirection(event) {
  if (isHotKey('down', event)) return directions.DOWN;
  else if (isHotKey('up', event)) return directions.UP;
  return null;
}

// Get the next index to navigate to based on the current index and
// navigation direction
function getNewIndex(currentIndex, direction, lastIndex) {
  const isDown = direction === directions.DOWN;
  const isUp = direction === directions.UP;
  const hasNoSelection = currentIndex === null;
  const isLast = currentIndex === lastIndex;
  const isFirst = currentIndex === 0;

  // return first index if navigating down from the last index
  // or down from the input field
  if (isDown && (hasNoSelection || isLast)) return 0;

  // return last index if navigating up from the first index
  // or up from the input field
  if (isUp && (hasNoSelection || isFirst)) return lastIndex;

  return currentIndex + direction;
}

// Find the DOM node of the selected item and scroll if necessary
function scrollToItem(list, index) {
  if (!list || !list.children.length) return;
  const item = list.children[index];
  item.scrollIntoView({ block: 'nearest' });
}
