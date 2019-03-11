import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

function ListItem({ isActive, status, label, onClick }) {
  return (
    <li
      data-test-id={`status-${status}`}
      className={cn('view-folder__item', { '-active': isActive })}
      onClick={() => onClick(status)}>
      <div className="view-folder__item-title">{label}</div>
    </li>
  );
}

ListItem.propTypes = {
  isActive: PropTypes.bool,
  status: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func
};

export default function ContentTypeListFilter({ status, onChange }) {
  return (
    <div className="view-folder">
      <div className="view-folder__title view-folder__header">Filter by status</div>
      <ul className="view-folder__list">
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
  onChange: PropTypes.func
};
