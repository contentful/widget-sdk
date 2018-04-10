import _ from 'lodash';
import * as React from 'react';
import PropTypes from 'prop-types';
import Highlighter from 'react-highlight-words';

export default function ListItem ({
  contentType,
  index,
  isHighlighted,
  getItemProps,
  onSelect,
  searchTerm,
  label
}) {
  return (
    <li
      {...getItemProps({ item: contentType, index })}
      role="menuitem"
      className={`context-menu__list-item ${isHighlighted ? 'active' : ''}`}
      data-test-id="contentType"
      onClick={() => onSelect(contentType)}
    >
      <Highlighter
        searchWords={[searchTerm]}
        textToHighlight={label}
        highlightClassName="context-menu__highlighted-text"
      />
    </li>
  );
}

ListItem.propTypes = {
  searchTerm: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  getItemProps: PropTypes.func.isRequired,
  isHighlighted: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  contentType: PropTypes.shape({
    name: PropTypes.string.isRequired
  }).isRequired
};
