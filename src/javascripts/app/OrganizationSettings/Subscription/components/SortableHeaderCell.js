import React from 'react';
import PropTypes from 'prop-types';

import { TableCell, IconButton } from '@contentful/forma-36-react-components';

export const SortableHeaderCell = ({ displayName, sortOrder, id, onSort }) => {
  const handleClick = () => {
    onSort(id);
  };

  const getSortIcon = (columnOrder) => {
    switch (columnOrder) {
      case 'ASC':
        return 'ArrowUp';
      case 'DESC':
        return 'ArrowDown';
      default:
        return 'Code';
    }
  };

  return (
    <TableCell onClick={handleClick}>
      {displayName}
      <IconButton
        tabIndex="-1"
        label="change-sort-order"
        buttonType="muted"
        iconProps={{
          icon: getSortIcon(sortOrder[id]),
        }}
      />
    </TableCell>
  );
};

SortableHeaderCell.propTypes = {
  displayName: PropTypes.string.isRequired,
  sortOrder: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  onSort: PropTypes.func.isRequired,
};
