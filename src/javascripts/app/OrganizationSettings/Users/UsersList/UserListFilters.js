import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
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

UserListFilters.defaultProps = {
  filters: [],
  spaces: [],
  spaceRoles: [],
};

UserListFilters.propTypes = {
  filters: PropTypes.arrayOf(FilterPropType),
  spaces: PropTypes.arrayOf(SpacePropType),
  spaceRoles: PropTypes.arrayOf(SpaceRolePropType),
  queryTotal: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

export function UserListFilters({ filters, spaceRoles, queryTotal, onChange, onReset }) {
  const updateFilters = (updatedFilter) => {
    const newFilterDefs = updateDependentFilterDefs(spaceRoles, filters, updatedFilter);
    onChange(newFilterDefs);
  };

  const hasActiveFilters = (filters) => {
    return filters.some((item) => {
      const value = item.filter.value;
      return !isNil(value) && value !== '';
    });
  };

  const byKey = keyBy(filters, 'filter.key');
  const { order, ...otherFilters } = byKey;
  const showResetButton = hasActiveFilters(Object.values(otherFilters));

  return (
    <section>
      <section className={styles.header}>
        <section className={styles.sort}>
          <SearchFilter key={order.id} {...order} onChange={updateFilters} />
        </section>
        <section className={styles.filters}>
          {Object.values(otherFilters).map((filter) => (
            <SearchFilter key={filter.id} {...filter} onChange={updateFilters} />
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
