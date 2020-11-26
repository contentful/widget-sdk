import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import classNames from 'classnames';
import tokens from '@contentful/forma-36-tokens';

import { TableCell, IconButton } from '@contentful/forma-36-react-components';

const styles = {
  flexCenter: css({
    display: 'flex',
    alignItems: 'center',
  }),
  emphasize: css({
    fontWeight: 'bold',
  }),
  sortable: css({
    '&:focus': {
      zIndex: 1,
    },
    '&:hover': {
      cursor: 'pointer',
      backgroundColor: tokens.colorElementLight,
    },
  }),
};

export const SortableHeaderCell = ({ displayName, sortOrder, id, onSort }) => {
  const handleClick = () => {
    onSort(id);
  };

  const sortDirection = sortOrder[id];

  return (
    <TableCell
      className={classNames({ [styles.sortable]: true, [styles.emphasize]: sortOrder[id] })}
      onClick={handleClick}>
      <span className={styles.flexCenter}>
        {displayName}
        {sortDirection && (
          <IconButton
            tabIndex="-1"
            label="change-sort-order"
            buttonType="muted"
            iconProps={{ icon: sortDirection === 'DESC' ? 'ArrowDown' : 'ArrowUp' }}
          />
        )}
      </span>
    </TableCell>
  );
};

SortableHeaderCell.propTypes = {
  displayName: PropTypes.string.isRequired,
  sortOrder: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  onSort: PropTypes.func.isRequired,
};
