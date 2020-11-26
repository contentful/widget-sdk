import React, { useState } from 'react';
import { TableCell, IconButton } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';

export const SortableHeaderCell = ({ displayName, onSort }) => {
  const [sortDirection, setSortDirection] = useState(null);

  const handleClick = () => {
    const newSortDirection =
      sortDirection === null || sortDirection === 'ascending' ? 'descending' : 'ascending';
    onSort(newSortDirection);
    setSortDirection(newSortDirection);
  };

  const sortDirectionIcon = () => {
    switch (sortDirection) {
      case 'ascending':
        return 'ArrowUp';
      case 'descending':
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
        // className={styles.marginLeftXS}
        buttonType="muted"
        iconProps={{
          icon: sortDirectionIcon(),
        }}
      />
    </TableCell>
  );
};

SortableHeaderCell.propTypes = {
  displayName: PropTypes.string.isRequired,
  onSort: PropTypes.func.isRequired,
};
