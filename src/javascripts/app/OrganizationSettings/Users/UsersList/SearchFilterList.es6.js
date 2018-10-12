import React from 'react';
import PropTypes from 'prop-types';
import { findIndex } from 'lodash';

import SearchFilter from './SearchFilter.es6';

export default class SearchFilterList extends React.Component {
  static propTypes = {
    filters: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired
  };

  updateFilters = filter => {
    const filters = [...this.props.filters];
    const index = findIndex(filters, f => f.filter.key === filter.key);
    filters[index] = { ...filters[index], filter };
    this.props.onChange(filters);
  };

  render() {
    return (
      <section style={{ display: 'flex' }}>
        {this.props.filters.map(filter => (
          <SearchFilter key={filter.param} {...filter} onChange={this.updateFilters} />
        ))}
      </section>
    );
  }
}
