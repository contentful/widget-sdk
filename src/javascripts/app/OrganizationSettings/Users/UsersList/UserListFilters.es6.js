import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { findIndex, keyBy, isNil } from 'lodash';
import { Filter as FilterPropType } from '../PropTypes.es6';
import { TextLink } from '@contentful/ui-component-library';

import SearchFilter from './SearchFilter.es6';

export default class UserListFilters extends React.Component {
  static propTypes = {
    filters: PropTypes.arrayOf(FilterPropType),
    queryTotal: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired
  };

  updateFilters = filter => {
    const filters = [...this.props.filters];
    const index = findIndex(filters, f => f.filter.key === filter.key);
    filters[index] = { ...filters[index], filter };
    this.props.onChange(filters);
  };

  hasActiveFilters(filters) {
    return filters.some(item => {
      const value = item.filter.value;
      return !isNil(value) && value !== '';
    });
  }

  reset = () => {
    this.props.onReset();
  };

  render() {
    const { filters, queryTotal } = this.props;
    const byKey = keyBy(filters, 'filter.key');
    const { order, ...otherFilters } = byKey;
    const showResetButton = this.hasActiveFilters(Object.values(otherFilters));

    return (
      <section className="user-list__filters">
        <div className="user-list__filters__column">
          <SearchFilter key={order.filter.key} {...order} onChange={this.updateFilters} />
          {`${pluralize('users', queryTotal, true)} found`}
        </div>
        <section className="user-list__filters__column">
          {showResetButton && (
            <TextLink onClick={this.reset} extraClassNames="user-list__reset-button">
              Clear filters
            </TextLink>
          )}
          {Object.values(otherFilters).map(filter => (
            <SearchFilter key={filter.filter.key} {...filter} onChange={this.updateFilters} />
          ))}
        </section>
      </section>
    );
  }
}
