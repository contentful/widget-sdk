import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { connect } from 'react-redux';
import { keyBy, isNil } from 'lodash';
import { TextLink } from '@contentful/forma-36-react-components';
import { updateDependentFilterDefs } from './UserListFiltersHelpers.es6';

import {
  Filter as FilterPropType,
  Space as SpacePropType,
  SpaceRole as SpaceRolePropType
} from 'app/OrganizationSettings/PropTypes.es6';
import SearchFilter from './SearchFilter.es6';

export class UserListFilters extends React.Component {
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

  updateFilters = updatedFilter => {
    const { spaceRoles, filters } = this.props;
    const newFilterDefs = updateDependentFilterDefs(spaceRoles, filters, updatedFilter);
    this.props.onChange(newFilterDefs);
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
          <SearchFilter key={order.id} {...order} onChange={this.updateFilters} />
          {`${pluralize('users', queryTotal, true)} found`}
        </div>
        <section className="user-list__filters__column">
          {showResetButton && (
            <TextLink onClick={onReset} extraClassNames="user-list__reset-button">
              Clear filters
            </TextLink>
          )}
          {Object.values(otherFilters).map(filter => (
            <SearchFilter key={filter.id} {...filter} onChange={this.updateFilters} />
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
