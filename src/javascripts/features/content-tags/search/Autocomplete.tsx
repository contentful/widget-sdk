// This file is lifted from forma with some small changes to suit a new use case
// it is hoped that forma will provide a new comp that supports the new case
// (selecting many items from the autocomplete at once)
import React, { useMemo, useReducer, useRef, useEffect } from 'react';

import {
  TextInput,
  Dropdown,
  DropdownList,
  DropdownListItem,
  SkeletonBodyText,
  SkeletonContainer,
  IconButton,
} from '@contentful/forma-36-react-components';

import cn from 'classnames';
import { css } from 'emotion';

const KEY_CODE = {
  ENTER: 13,
  ARROW_DOWN: 40,
  ARROW_UP: 38,
  TAB: 9,
};

const styles = {
  autocompleteDropdown: css(`display: block;`),
  autocompleteInput: css(`display: flex;`),
  inputIconButton: css(`
        position: relative;
        margin-left: calc(-1 * var(--spacing-xl));
    `),
};

const TOGGLED_LIST = 'TOGGLED_LIST';
const NAVIGATED_ITEMS = 'NAVIGATED_ITEMS';
const QUERY_CHANGED = 'QUERY_CHANGED';
const ITEM_SELECTED = 'ITEM_SELECTED';

interface RenderToggleElementProps {
  query?: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onToggle: () => void;
  disabled?: boolean;
  placeholder?: string;
  width?: 'small' | 'medium' | 'large' | 'full';
  inputRef: React.RefObject<HTMLInputElement>;
  name?: string;
}

export interface AutocompleteProps<T extends {}> {
  children: (items: T[]) => React.ReactNode[];
  items: T[];
  onChange: (item: T) => void;
  onQueryChange: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
  width?: 'small' | 'medium' | 'large' | 'full';
  className?: string;
  maxHeight?: number;
  isLoading?: boolean;
  takeFocus?: boolean;
  emptyListMessage?: string;
  noMatchesMessage?: string;
  willUpdateOnSelect?: boolean;
  willClearQueryOnClose?: boolean;
  dropdownProps?: any;
  dropdownListItemProps?: any;
  renderToggleElement?: (props: RenderToggleElementProps) => React.ReactElement;
}

interface State {
  isOpen?: boolean;
  query: string;
  highlightedItemIndex: number | null;
}

type Action =
  | { type: typeof TOGGLED_LIST; payload?: boolean }
  | { type: typeof NAVIGATED_ITEMS; payload: number | null }
  | { type: typeof QUERY_CHANGED; payload: string }
  | { type: typeof ITEM_SELECTED };

enum Direction {
  DOWN = 1,
  UP = -1,
}

const initialState: State = {
  isOpen: false,
  query: '',
  highlightedItemIndex: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case TOGGLED_LIST:
      return {
        ...state,
        isOpen: action.payload,
        highlightedItemIndex: null,
      };
    case NAVIGATED_ITEMS:
      return {
        ...state,
        isOpen: true,
        highlightedItemIndex: action.payload,
      };
    case QUERY_CHANGED:
      return {
        ...state,
        highlightedItemIndex: null,
        isOpen: true,
        query: action.payload,
      };
    case ITEM_SELECTED:
      return { ...initialState };
    default:
      return state;
  }
};

export const Autocomplete = <T extends {}>({
  children,
  items = [],
  disabled,
  onChange,
  onQueryChange,
  placeholder = 'Search',
  name = 'Search',
  width,
  className,
  maxHeight,
  isLoading,
  takeFocus,
  emptyListMessage = 'No options',
  noMatchesMessage = 'No matches',
  willUpdateOnSelect = true,
  willClearQueryOnClose,
  dropdownProps,
  dropdownListItemProps,
  renderToggleElement,
}: AutocompleteProps<T>) => {
  const listRef: React.MutableRefObject<HTMLDivElement | undefined> = useRef();
  const inputRef: React.MutableRefObject<HTMLInputElement | undefined> = useRef();

  const [{ isOpen, query, highlightedItemIndex }, dispatch] = useReducer(reducer, initialState);

  const toggleList = (isOpen?: boolean): void => {
    dispatch({ type: TOGGLED_LIST, payload: isOpen });
  };

  const selectItem = (item: T) => {
    if (willUpdateOnSelect) {
      dispatch({ type: ITEM_SELECTED });
      onQueryChange('');
    }
    onChange(item);
  };

  const updateQuery = (value: string) => {
    dispatch({ type: QUERY_CHANGED, payload: value });
    onQueryChange(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const isEnter = event.keyCode === KEY_CODE.ENTER;
    const isTab =
      event.keyCode === KEY_CODE.TAB || (event.keyCode === KEY_CODE.TAB && event.shiftKey);

    const hasUserSelection = highlightedItemIndex !== null;
    const lastIndex = items.length ? items.length - 1 : 0;
    const direction = getNavigationDirection(event);

    if (direction) {
      const newIndex = getNewIndex(highlightedItemIndex as number, direction, lastIndex);
      if (listRef.current) {
        scrollToItem(listRef.current, newIndex);
      }
      dispatch({ type: NAVIGATED_ITEMS, payload: newIndex });
    } else if (isEnter && hasUserSelection) {
      const selected = items[highlightedItemIndex as number];
      selectItem(selected);
    } else if (isTab) {
      toggleList(false);
    }
  };

  const handleInputButtonClick = () => {
    query ? updateQuery('') : toggleList();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (takeFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [takeFocus]);

  const options = useMemo(
    () =>
      children(items).map((child, index) => ({
        child,
        option: items[index],
      })),
    [children, items]
  );

  const dropdownClassNames = cn(styles.autocompleteDropdown, className);

  function renderDefaultToggleElement(toggleProps: RenderToggleElementProps) {
    return (
      <div className={styles.autocompleteInput}>
        <TextInput
          value={toggleProps.query}
          onChange={(e) => toggleProps.onChange(e.target.value)}
          onFocus={toggleProps.onFocus}
          onKeyDown={toggleProps.onKeyDown}
          disabled={toggleProps.disabled}
          placeholder={toggleProps.placeholder}
          width={toggleProps.width}
          inputRef={toggleProps.inputRef}
          testId="autocomplete.input"
          type="search"
          autoComplete="off"
          aria-label={toggleProps.name}
        />
        <IconButton
          className={styles.inputIconButton}
          tabIndex={-1}
          buttonType="muted"
          iconProps={{ icon: toggleProps.query ? 'Close' : 'ChevronDown' }}
          onClick={toggleProps.onToggle}
          label={toggleProps.query ? 'Clear' : 'Show list'}
        />
      </div>
    );
  }

  const toggleProps = {
    name,
    query,
    disabled,
    placeholder,
    width,
    onChange: updateQuery,
    onFocus: () => toggleList(true),
    onKeyDown: handleKeyDown,
    onToggle: handleInputButtonClick,
    inputRef: inputRef as React.RefObject<HTMLInputElement>,
  };

  const renderToggleElementFunction = renderToggleElement || renderDefaultToggleElement;

  return (
    <Dropdown
      className={dropdownClassNames}
      isOpen={isOpen}
      onClose={() => {
        willClearQueryOnClose && updateQuery('');
        dispatch({ type: TOGGLED_LIST });
      }}
      toggleElement={renderToggleElementFunction(toggleProps)}
      {...dropdownProps}>
      <DropdownList testId="autocomplete.dropdown-list" maxHeight={maxHeight}>
        <div ref={listRef as React.RefObject<HTMLDivElement>}>
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
                  testId="autocomplete.dropdown-list-item"
                  {...dropdownListItemProps}>
                  {child}
                </DropdownListItem>
              );
            })
          )}
        </div>
      </DropdownList>
    </Dropdown>
  );
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

function getNavigationDirection(event: React.KeyboardEvent): Direction | null {
  if (event.keyCode === KEY_CODE.ARROW_DOWN) {
    return Direction.DOWN;
  }

  if (event.keyCode === KEY_CODE.ARROW_UP) {
    return Direction.UP;
  }

  return null;
}

// Get next navigation index based on current index and navigation direction
function getNewIndex(currentIndex: number, direction: Direction, lastIndex: number): number {
  const isDown = direction === Direction.DOWN;
  const isUp = direction === Direction.UP;
  const hasNoUserSelection = currentIndex === null;
  const isLast = currentIndex === lastIndex;
  const isFirst = currentIndex === 0;

  if (isDown && (hasNoUserSelection || isLast)) {
    return 0;
  }

  if (isUp && (hasNoUserSelection || isFirst)) {
    return lastIndex;
  }

  return currentIndex + direction;
}

// Find the DOM node at index and scroll if necessary
function scrollToItem(list: HTMLElement, index: number): void {
  if (!list || !list.children.length) {
    return;
  }

  const item = list.children[index as number];
  item.scrollIntoView({ block: 'nearest' });
}
