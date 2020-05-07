import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import { connect } from 'react-redux';
import { keyBy, isNil } from 'lodash';
import { TextLink } from '@contentful/forma-36-react-components';
import { updateDependentFilterDefs } from './UserListFiltersHelpers';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

import {
  Filter as FilterPropType,
  Space as SpacePropType,
  SpaceRole as SpaceRolePropType,
} from 'app/OrganizationSettings/PropTypes';
import SearchFilter from './SearchFilter';

const styles = {
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    color: tokens.colorTextLight,
  }),
  sort: css({
    display: 'flex',
    flexGrow: '1',
    marginBottom: '30px',
    minWidth: '165px',
    marginRight: tokens.spacing4Xl,
  }),
  filters: css({
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  }),
  subheader: css({
    color: tokens.colorTextLight,
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingS,
  }),
};

export class UserListFilters extends React.Component {
  static propTypes = {
    filters: PropTypes.arrayOf(FilterPropType),
    spaces: PropTypes.arrayOf(SpacePropType),
    spaceRoles: PropTypes.arrayOf(SpaceRolePropType),
    queryTotal: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
  };

  static defaultProps = {
    filters: [],
    spaces: [],
    spaceRoles: [],
  };

  updateFilters = (updatedFilter) => {
    const { spaceRoles, filters } = this.props;
    const newFilterDefs = updateDependentFilterDefs(spaceRoles, filters, updatedFilter);
    this.props.onChange(newFilterDefs);
  };

  hasActiveFilters(filters) {
    return filters.some((item) => {
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
      <section>
        <section className={styles.header}>
          <section className={styles.sort}>
            <SearchFilter key={order.id} {...order} onChange={this.updateFilters} />
          </section>
          <section className={styles.filters}>
            {Object.values(otherFilters).map((filter) => (
              <SearchFilter key={filter.id} {...filter} onChange={this.updateFilters} />
            ))}
          </section>
        </section>
        <section className={styles.subheader}>
          <span>{`${pluralize('users', queryTotal, true)} found`}</span>
          {showResetButton && <TextLink onClick={onReset}>Clear filters</TextLink>}
        </section>
      </section>
    );
  }
}

export default connect(null, (dispatch) => ({
  onChange: (newFilters) => dispatch({ type: 'CHANGE_FILTERS', payload: { newFilters } }),
  onReset: () => dispatch({ type: 'RESET_FILTERS' }),
}))(UserListFilters);
