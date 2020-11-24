import React, { useState } from 'react';
import { TableCell, IconButton } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';

export const SortableHeaderCell = ({ displayName, onSort }) => {
  const [isAscending, setIsAscending] = useState(true);

  const handleClick = () => {
    const toggled = !isAscending;
    onSort(toggled);
    setIsAscending(toggled);
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
          icon: isAscending ? 'ArrowUp' : 'ArrowDown',
        }}
      />
    </TableCell>
  );
};

SortableHeaderCell.propTypes = {
  displayName: PropTypes.string.isRequired,
  onSort: PropTypes.func.isRequired,
};
