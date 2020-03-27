import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

const handleColumnsRows = (val) => {
  let result = '';
  if (typeof val === 'number') {
    for (let i = 0; i < val; i++) {
      result = result.concat(' auto');
    }
    return result;
  }
  return val;
};

export const Grid = (props) => {
  const {
    rows = 'auto',
    columns = 'auto',
    children,
    inline = false,
    columnGap = '24px',
    rowGap = '0',
    justifyContent,
    alignContent,
    ...rest
  } = props;

  const styles = {
    grid: css({
      display: inline ? 'inline-grid' : 'grid',
      gridTemplateColumns: handleColumnsRows(columns),
      gridTemplateRows: handleColumnsRows(rows),
      gridGap: `${columnGap} ${rowGap}`,
      justifyContent,
      alignContent,
    }),
  };

  return (
    <div className={styles.grid} {...rest}>
      {children}
    </div>
  );
};

Grid.propTypes = {
  rows: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  columns: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  inline: PropTypes.bool,
  columnGap: PropTypes.string,
  rowGap: PropTypes.string,
  justifyContent: PropTypes.string,
  alignContent: PropTypes.string,
};

export const GridItem = (props) => {
  const { children, columnStart, columnEnd, rowStart, rowEnd, area, order, ...rest } = props;

  const styles = {
    gridItem: css({
      gridColumnStart: columnStart,
      gridColumnEnd: columnEnd,
      gridRowStart: rowStart,
      gridRowEnd: rowEnd,
      gridArea: area,
      order,
    }),
  };

  return (
    <div className={styles.gridItem} {...rest}>
      {children}
    </div>
  );
};

GridItem.propTypes = {
  columnStart: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  columnEnd: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  rowStart: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  rowEnd: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  area: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  order: PropTypes.number,
};
