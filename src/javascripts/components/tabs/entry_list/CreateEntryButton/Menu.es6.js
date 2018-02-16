import _ from 'lodash';
import { createElement as h } from 'libs/react';
import PropTypes from 'libs/prop-types';
import createReactClass from 'create-react-class';
import { asReact } from 'ui/Framework/DOMRenderer';
import Downshift from 'libs/downshift';
import Highlighter from 'libs/react-highlight-words';
import SearchIcon from 'svg/search';

const MAX_ITEMS_WITHOUT_SEARCH = 20;
const SUGGESTION_GROUP_LENGTH = 1;
const Position = {
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left'
};

const Menu = createReactClass({
  propTypes: {
    contentTypes: PropTypes.array.isRequired,
    suggestedContentTypeId: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    onClose: PropTypes.func
  },
  getDefaultProps () {
    return {
      suggestedContentTypeId: null,
      onClose: _.noop
    };
  },
  getInitialState () {
    return {
      positionY: Position.BOTTOM,
      positionX: Position.LEFT
    };
  },
  componentDidMount () {
    const menuTopPosition = this.menu.getBoundingClientRect().top;
    const menuLeftPosition = this.menu.getBoundingClientRect().left;
    const maxMenuHeight = 600;
    const maxMenuWidth = 450;

    this.setState({
      positionY: menuTopPosition < maxMenuHeight ? Position.BOTTOM : Position.TOP,
      positionX: menuLeftPosition < maxMenuWidth ? Position.LEFT : Position.RIGHT
    });
  },
  render () {
    const {
      contentTypes,
      suggestedContentTypeId,
      onSelect,
      onClose
    } = this.props;

    return h(
      'div',
      {
        className: `create-entry__menu context-menu context-menu--redesigned ${this.state.positionX} ${this.state.positionY}`,
        role: 'menu',
        'aria-label': 'Add Entry',
        'data-test-id': 'add-entry-menu',
        ref: (menu) => { this.menu = menu; }
      },
      h(Downshift, {
        onChange: onSelect,
        onStateChange: (changes) => {
          if (changes.type === Downshift.stateChangeTypes.keyDownEscape) {
            onClose();
          }
        },
        isOpen: true,
        itemToString: ct => _.isEmpty(ct) ? '' : ct.sys.id,
        render: renderMenu({ contentTypes, suggestedContentTypeId, onSelect })
      })
    );
  }
});

function renderMenu ({ contentTypes, suggestedContentTypeId, onSelect }) {
  return ({
    getInputProps,
    getItemProps,
    inputValue,
    highlightedIndex
  }) => {
    const suggestedContentType = getContentTypeById(
      contentTypes,
      suggestedContentTypeId
    );
    const isSearchable = contentTypes.length > MAX_ITEMS_WITHOUT_SEARCH;
    const filteredContentTypes = getFilteredContentTypesByInputValue(contentTypes, inputValue);

    return h(
      'div',
      null,
      isSearchable && h(SearchInput, { getInputProps }),
      h('div', {
        className: 'context-menu__list'
      },
        filteredContentTypes.length > 0 ? (
          inputValue.length > 0
          ? h(
            Group,
            {
              title: `${filteredContentTypes.length} results`
            },
            h(ContentTypeList, {
              contentTypes: filteredContentTypes,
              getItemProps,
              highlightedIndex,
              searchTerm: inputValue,
              onSelect
            })
          )
          : [
            suggestedContentType && h(SuggestedContentType, {
              key: 'group-suggested',
              suggestedContentType,
              getItemProps,
              highlightedIndex,
              onSelect
            }),
            h(
              Group,
              {
                key: 'all',
                title: 'All content types',
                testId: 'group-all'
              },
              h(ContentTypeList, {
                contentTypes: filteredContentTypes,
                getItemProps,
                highlightedIndex,
                searchTerm: inputValue,
                suggestionGroupLength: SUGGESTION_GROUP_LENGTH,
                onSelect
              })
            )
          ]
        ) : h(NotFoundMessage)
      )
    );
  };
}

export default Menu;

export function SuggestedContentType ({ suggestedContentType, getItemProps, highlightedIndex, onSelect }) {
  return [
    h(
      Group,
      {
        key: 'group',
        title: 'Suggested content type',
        testId: 'group-suggested'
      },
      h(ContentTypeList, {
        contentTypes: [suggestedContentType],
        getItemProps,
        highlightedIndex,
        onSelect
      })
    ),
    h('hr', {
      key: 'separator'
    })
  ];
}

function ContentTypeList ({
  contentTypes,
  getItemProps,
  highlightedIndex,
  suggestionGroupLength = 0,
  searchTerm,
  onSelect
}) {
  return contentTypes.map((contentType, index) => h(ListItem, {
    key: contentType.sys.id,
    getItemProps,
    index: index + suggestionGroupLength,
    isHighlighted: highlightedIndex === (index + suggestionGroupLength),
    contentType,
    searchTerm,
    onSelect
  }));
}

export function ListItem ({
  contentType,
  index,
  isHighlighted,
  getItemProps,
  onSelect,
  searchTerm
}) {
  return h(
    'li', {
      ...getItemProps({ item: contentType, index }),
      role: 'menuitem',
      className: `context-menu__list-item ${isHighlighted ? 'active' : ''}`,
      'data-test-id': 'contentType',
      onClick: () => onSelect(contentType)
    },
    h(Highlighter, {
      searchWords: [searchTerm],
      textToHighlight: getContentTypeName(contentType),
      highlightClassName: 'context-menu__highlighted-text'
    })

  );
}

export function SearchInput ({ getInputProps }) {
  return h('div', null,
    h('input', {
      ...getInputProps({ placeholder: 'Search all content types' }),
      autoFocus: true,
      className: 'cfnext-form__input--full-size context-menu__search-input',
      'data-test-id': 'addEntrySearchInput'
    }),
   h('i', { className: 'context-menu__search-input-icon' }, asReact(SearchIcon))
  );
}

export function Group ({ title, testId, children }) {
  return h(
    'div',
    null,
    h(
      'div',
      {
        className: 'context-menu__header',
        'data-test-id': testId
      },
      title
    ),
    h('ul', null, children)
  );
}

export function NotFoundMessage () {
  return h('div', {style: { padding: '16px 20px 12px' }}, 'No results found');
}

function getContentTypeById (contentTypes, id) {
  return contentTypes.find(ct => ct.sys.id === id);
}

function getContentTypeName (contentType) {
  return contentType.name || 'Untitled';
}

function getFilteredContentTypesByInputValue (contentTypes, inputValue) {
  return contentTypes.filter(
    (contentType) =>
      !inputValue ||
      getContentTypeName(contentType)
        .toLowerCase()
        .includes(inputValue.toLowerCase()
    )
  );
}
