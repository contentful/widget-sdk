import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { findIndex, keyBy, isNil } from 'lodash';
import { connect } from 'react-redux';
import { TextLink } from '@contentful/ui-component-library';

import userListFiltersMiddleware from './UserListFiltersMiddleware.es6';

import {
  Filter as FilterPropType,
  Space as SpacePropType,
  SpaceRole as SpaceRolePropType
} from '../PropTypes.es6';
import SearchFilter from './SearchFilter.es6';

class UserListFilters extends React.Component {
  static propTypes = {
    filters: PropTypes.arrayOf(FilterPropType),
    spaces: PropTypes.arrayOf(SpacePropType),
    spaceRoles: PropTypes.arrayOf(SpaceRolePropType),
    queryTotal: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired
  };

  static defaultProps = {
    filters: [],
    spaces: [],
    spaceRoles: []
  };

  filterMiddleware = userListFiltersMiddleware(this.props.spaceRoles);

  updateFilters = filter => {
    const { filters } = this.props;

    const clone = JSON.parse(JSON.stringify(filters)); // god, forgive me
    const index = findIndex(filters, f => f.filter.key === filter.key);

    clone[index] = { ...clone[index], filter };

    this.filterMiddleware.update(filters, clone);
    this.props.onChange(clone);
  };

  hasActiveFilters(filters) {
    return filters.some(item => {
      const value = item.filter.value;
      return !isNil(value) && value !== '';
    });
  }

  render() {
    const { filters, queryTotal, onReset } = this.props;
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
            <TextLink onClick={onReset} extraClassNames="user-list__reset-button">
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

export default connect(
  null,
  dispatch => ({
    onChange: newFilters => dispatch({ type: 'CHANGE_FILTERS', payload: { newFilters } }),
    onReset: () => dispatch({ type: 'RESET_FILTERS' })
  })
)(UserListFilters);
