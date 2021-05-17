import React from 'react';
import { cx, css } from 'emotion';
import { Flex, TableCell, Icon } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  active: css({
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

export type SortOrder = 'ASC' | 'DESC';

export enum ColumnId {
  SPACE_NAME = 'spaceName',
  PLAN_NAME = 'planName',
  ENVIRONMENTS = 'environments',
  ROLES = 'roles',
  LOCALES = 'locales',
  CONTENT_TYPES = 'contentTypes',
  RECORDS = 'records',
}

interface SortableHeaderCellProps {
  // It will be used by the onSort function to change the state in SpacePlansTable
  columnId: ColumnId;
  // The copy that will be show to the user
  displayName: string;
  // It tells if this is the column being sorted currently
  isActiveSort?: boolean;
  // Function that will be called when the user clicks on the header cell
  onSort: (columnId: ColumnId) => void;
  // It tells the component which arror icon it should render
  sortOrder: SortOrder;
}

export function SortableHeaderCell({
  columnId,
  displayName,
  isActiveSort = false,
  onSort,
  sortOrder,
}: SortableHeaderCellProps) {
  const handleClick = () => onSort(columnId);

  return (
    <TableCell
      className={cx(styles.sortable, { [styles.active]: isActiveSort })}
      onClick={handleClick}>
      <Flex alignItems="center">
        {displayName}
        {isActiveSort && <Icon icon={sortOrder === 'DESC' ? 'ArrowDown' : 'ArrowUp'} />}
      </Flex>
    </TableCell>
  );
}
