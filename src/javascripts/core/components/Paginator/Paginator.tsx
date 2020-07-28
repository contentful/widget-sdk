import React from 'react';
import _ from 'lodash';
import cn from 'classnames';

// Number of pages to display in the paginator on either side of the
// current page.
const NO_OF_NEIGHBORS = 2;

// Number of pages to display, including first and last page
const DISPLAY_PAGES = 3 + NO_OF_NEIGHBORS * 2;

/**
 * Renders a paginator that shows the current page and allows the user
 * to select different pages.
 *
 * Note that the page number is zero-based for both the `page` and
 * `select` argument.
 */

type PaginatorProps = {
  select?: Function;
  page?: number;
  pageCount?: number;
  className?: string;
};

export function Paginator({ className, select = _.noop, page = 0, pageCount = 0 }: PaginatorProps) {
  if (pageCount < 2) {
    return null;
  }
  const atLast = page >= pageCount - 1;
  const atFirst = page <= 0;
  const pages = getLabels(getRange(pageCount, page + 1));

  // TODO inline styles
  // TODO This should be a button so we do not select the previous
  // page when it is disabled. For now we check `!atFirst` in the
  // event handler.
  return (
    <div className={cn('search-results-paginator', className)} data-test-id="paginator">
      <span
        aria-disabled={atFirst ? 'true' : 'false'}
        data-test-id="paginator.prev"
        className="search-results-paginator__prev"
        onClick={() => !atFirst && select(page - 1)}>
        Previous
      </span>
      <div data-test-id="paginator.pages">
        {pages.map((value, idx) => {
          if (value === -1) {
            return (
              <span key={idx} className="search-results-paginator__page x--dots">
                …
              </span>
            );
          } else {
            return (
              <span
                key={idx}
                className={`search-results-paginator__page ${
                  value === page ? 'x--active-page' : ''
                }`}
                data-test-id={`paginator.select.${value}`}
                onClick={() => select(value)}
                aria-selected={value === page ? 'true' : 'false'}>
                {value + 1}
              </span>
            );
          }
        })}
      </div>
      <span
        aria-disabled={atLast ? 'true' : 'false'}
        data-test-id="paginator.next"
        className="search-results-paginator__next"
        onClick={() => !atLast && select(page + 1)}>
        Next
      </span>
    </div>
  );
}

// TODO This is to complicated. Rewrite it
function getRange(pageCount: number, activePage: number): number[] {
  if (pageCount <= DISPLAY_PAGES) {
    return _.range(1, pageCount + 1);
  } else {
    const neighbors = _.range(activePage - NO_OF_NEIGHBORS, activePage + NO_OF_NEIGHBORS + 1);
    const range = _([1])
      .concat(neighbors)
      .concat(pageCount)
      .filter((v) => v > 0 && v <= pageCount)
      .sortedUniq()
      .value();

    if (range.length < DISPLAY_PAGES) {
      const mid = Math.ceil(pageCount / 2);
      return activePage <= mid
        ? getRange(pageCount, activePage + 1)
        : getRange(pageCount, activePage - 1);
    } else {
      return range;
    }
  }
}

function getLabels(list: number[]): number[] {
  const newList = list.map((i) => i - 1);

  if (newList.length === DISPLAY_PAGES) {
    if (newList[DISPLAY_PAGES - 1] - newList[DISPLAY_PAGES - 2] !== 1) {
      newList.splice(DISPLAY_PAGES - 1, 0, -1);
    }
    if (newList[1] - newList[0] !== 1) {
      newList.splice(1, 0, -1);
    }
  }

  return newList;
}
