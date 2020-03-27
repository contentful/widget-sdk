import React from 'react';
import PropTypes from 'prop-types';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  filterList: css({
    margin: `0 -${tokens.spacingL} 10px -${tokens.spacingL}`,
  }),
};

function ListItem({ isActive, status, label, onClick }) {
  return (
    <li
      data-test-id={`status-${status}`}
      className={cx('view-folder__item', { '-active': isActive })}
      onClick={() => onClick(status)}>
      <div className="view-folder__item-title">{label}</div>
    </li>
  );
}

ListItem.propTypes = {
  isActive: PropTypes.bool,
  status: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func,
};

export default function ContentTypeListFilter({ status, onChange }) {
  return (
    <div className="view-folder" data-test-id="status-filter">
      <div className="view-folder__title view-folder__header">Filter by status</div>
      <ul className={cx('view-folder__list', styles.filterList)}>
        <ListItem
          isActive={status === undefined}
          status={undefined}
          onClick={onChange}
          label="All"
        />
        <ListItem
          isActive={status === 'changed'}
          status="changed"
          onClick={onChange}
          label="Changed"
        />
        <ListItem isActive={status === 'draft'} status="draft" onClick={onChange} label="Draft" />
        <ListItem
          isActive={status === 'active'}
          status="active"
          onClick={onChange}
          label="Active"
        />
      </ul>
    </div>
  );
}

ContentTypeListFilter.propTypes = {
  status: PropTypes.string,
  onChange: PropTypes.func,
};
