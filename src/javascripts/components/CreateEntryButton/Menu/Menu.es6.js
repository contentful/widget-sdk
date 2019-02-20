import _ from 'lodash';
import * as React from 'react';
import PropTypes from 'prop-types';
import Downshift from 'downshift';
import cn from 'classnames';
import ListItem from './ListItem.es6';
import SearchInput from './SearchInput.es6';
import Group from './Group.es6';
import NoResults from './NoResults.es6';

const MAX_ITEMS_WITHOUT_SEARCH = 20;
const SUGGESTION_GROUP_LENGTH = 1;
const Position = {
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left'
};

class Menu extends React.Component {
  static propTypes = {
    contentTypes: PropTypes.array.isRequired,
    suggestedContentTypeId: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    onClose: PropTypes.func
  };

  static defaultProps = {
    onClose: _.noop
  };

  state = {
    positionY: Position.BOTTOM,
    positionX: Position.LEFT
  };

  componentDidMount() {
    const { width, height, x, y } = this.menu.getBoundingClientRect();
    const minDistanceToViewportBorder = 10;

    this.setState({
      positionY:
        y + height + minDistanceToViewportBorder < window.innerHeight
          ? Position.BOTTOM
          : Position.TOP,
      positionX:
        x + width + minDistanceToViewportBorder < window.innerWidth ? Position.LEFT : Position.RIGHT
    });
  }

  handleStateChange = changes => {
    if (changes.type === Downshift.stateChangeTypes.keyDownEscape) {
      this.props.onClose();
    }
  };

  getStateAndHelpers = downshift => {
    const { contentTypes, suggestedContentTypeId, onSelect } = this.props;

    return {
      ...downshift,
      contentTypes,
      suggestedContentTypeId,
      onSelect
    };
  };

  render() {
    const { onSelect } = this.props;
    const className = cn(
      'create-entry__menu',
      'context-menu',
      'context-menu--redesigned',
      this.state.positionX,
      this.state.positionY
    );
    return (
      <div
        className={className}
        role="menu"
        aria-label="Add Entry"
        data-test-id="add-entry-menu"
        ref={menu => {
          this.menu = menu;
        }}>
        <Downshift
          onChange={onSelect}
          onStateChange={this.handleStateChange}
          isOpen
          itemToString={ct => (_.isEmpty(ct) ? '' : ct.sys.id)}>
          {downshift => renderMenu(this.getStateAndHelpers(downshift))}
        </Downshift>
      </div>
    );
  }
}

/* eslint-disable react/prop-types */
function renderMenu({
  contentTypes,
  suggestedContentTypeId,
  onSelect,
  getInputProps,
  getItemProps,
  inputValue,
  highlightedIndex
}) {
  /* eslint-enable react/prop-types */
  const suggestedContentType = getContentTypeById(contentTypes, suggestedContentTypeId);
  const isSearchable = contentTypes.length > MAX_ITEMS_WITHOUT_SEARCH;
  const filteredContentTypes = getFilteredContentTypesByInputValue(contentTypes, inputValue);

  const hasSearchValue = inputValue.length > 0;
  const searchResultsTitle =
    filteredContentTypes.length === 1 ? `1 result` : `${filteredContentTypes.length} results`;

  return (
    <div>
      {isSearchable && <SearchInput getInputProps={getInputProps} />}
      <div className="context-menu__list">
        {filteredContentTypes.length > 0 ? (
          hasSearchValue ? (
            <Group title={searchResultsTitle}>
              <ContentTypeList
                contentTypes={filteredContentTypes}
                getItemProps={getItemProps}
                highlightedIndex={highlightedIndex}
                searchTerm={inputValue}
                onSelect={onSelect}
              />
            </Group>
          ) : (
            <React.Fragment>
              {suggestedContentType && (
                <React.Fragment>
                  <Group title="Suggested content type" testId="group-suggested">
                    <ContentTypeList
                      contentTypes={[suggestedContentType]}
                      getItemProps={getItemProps}
                      highlightedIndex={highlightedIndex}
                      onSelect={onSelect}
                    />
                  </Group>
                  <hr />
                </React.Fragment>
              )}
              <Group title="All content types" testId="group-all">
                <ContentTypeList
                  contentTypes={filteredContentTypes}
                  getItemProps={getItemProps}
                  highlightedIndex={highlightedIndex}
                  searchTerm={inputValue}
                  suggestionGroupLength={SUGGESTION_GROUP_LENGTH}
                  onSelect={onSelect}
                />
              </Group>
            </React.Fragment>
          )
        ) : (
          <NoResults />
        )}
      </div>
    </div>
  );
}

export default Menu;

function ContentTypeList({
  contentTypes,
  getItemProps,
  highlightedIndex,
  suggestionGroupLength = 0,
  searchTerm,
  onSelect
}) {
  return contentTypes.map((contentType, index) => (
    <ListItem
      key={contentType.sys.id}
      getItemProps={getItemProps}
      index={index + suggestionGroupLength}
      isHighlighted={highlightedIndex === index + suggestionGroupLength}
      contentType={contentType}
      searchTerm={searchTerm}
      onSelect={onSelect}
      label={getContentTypeName(contentType)}
    />
  ));
}

function getContentTypeById(contentTypes, id) {
  return contentTypes.find(ct => ct.sys.id === id);
}

function getContentTypeName(contentType) {
  return contentType.name || 'Untitled';
}

function getFilteredContentTypesByInputValue(contentTypes, inputValue) {
  return contentTypes.filter(
    contentType =>
      !inputValue ||
      getContentTypeName(contentType)
        .toLowerCase()
        .includes(inputValue.toLowerCase())
  );
}
