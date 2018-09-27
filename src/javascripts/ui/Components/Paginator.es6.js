import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

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

function Paginator({ select, page, pageCount }) {
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
    <div className="search-results-paginator" data-test-id="paginator">
      <span
        aria-disabled={String(atFirst)}
        data-test-id="paginator.prev"
        className="search-results-paginator__prev"
        onClick={() => !atFirst && select(page - 1)}>
        Previous
      </span>
      <div data-test-id="paginator.pages">
        {pages.map(value => {
          if (value === null) {
            return (
              <span key={`page-null`} className="search-results-paginator__page x--dots">
                …
              </span>
            );
          } else {
            return (
              <span
                key={`page-${value}`}
                className={`search-results-paginator__page ${
                  value === page ? 'x--active-page' : ''
                }`}
                data-test-id={`paginator.select.${value}`}
                onClick={() => select(value)}
                aria-selected={String(value === page)}>
                {value + 1}
              </span>
            );
          }
        })}
      </div>
      <span
        aria-disabled={String(atLast)}
        data-test-id="paginator.next"
        className="search-results-paginator__next"
        onClick={() => !atLast && select(page + 1)}>
        Next
      </span>
    </div>
  );
}

// TODO This is to complicated. Rewrite it
function getRange(pageCount, activePage) {
  if (pageCount <= DISPLAY_PAGES) {
    return _.range(1, pageCount + 1);
  } else {
    const neighbors = _.range(activePage - NO_OF_NEIGHBORS, activePage + NO_OF_NEIGHBORS + 1);
    const range = _([1])
      .concat(neighbors)
      .concat(pageCount)
      .filter(v => v > 0 && v <= pageCount)
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

function getLabels(list) {
  list = list.map(i => i - 1);

  if (list.length === DISPLAY_PAGES) {
    if (list[DISPLAY_PAGES - 1] - list[DISPLAY_PAGES - 2] !== 1) {
      list.splice(DISPLAY_PAGES - 1, 0, null);
    }
    if (list[1] - list[0] !== 1) {
      list.splice(1, 0, null);
    }
  }

  return list;
}

Paginator.propTypes = {
  select: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired
};

export default Paginator;
