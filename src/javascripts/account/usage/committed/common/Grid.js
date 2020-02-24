import React from 'react';
import { css } from 'emotion';

const handleColumnsRows = val => {
  let result = "";
  if (typeof val === "number") {
    for (let i = 0; i < val; i++) {
      result = result.concat(" auto");
    }
    return result;
  }
  return val;
};

export const Grid = props => {
  const {
    rows = "auto",
    columns = "auto",
    children,
    inline = false,
    columnGap = "24px",
    rowGap = "0",
    justifyContent,
    alignContent,
    ...rest
  } = props;

  const styles = {
    grid: css({
      display: inline ? "inline-grid" : "grid",
      gridTemplateColumns: handleColumnsRows(columns),
      gridTemplateRows: handleColumnsRows(rows),
      gridGap: `${columnGap} ${rowGap}`,
      justifyContent,
      alignContent
    })
  }

  return (
    <div className={styles.grid} {...rest}>
      {children}
    </div>
  );
};

export const GridItem = props => {
  const {
    children,
    columnStart,
    columnEnd,
    rowStart,
    rowEnd,
    area,
    order,
    ...rest
  } = props;

  const styles = {
    gridItem: css({
      gridColumnStart: columnStart,
      gridColumnEnd: columnEnd,
      gridRowStart: rowStart,
      gridRowEnd: rowEnd,
      gridArea: area,
      order
    })
  }
  
  return (
    <div className={styles.gridItem} {...rest}>
      {children}
    </div>
  );
};