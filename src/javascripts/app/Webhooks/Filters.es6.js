import React from 'react';
import PropTypes from 'prop-types';
import {
  CONSTRAINT_TYPES,
  CONSTRAINT_NAMES,
  PATH_VALUES,
  PATHS
} from './FiltersState';

const PATH_TITLES = {
  [PATH_VALUES.ENVIRONMENT]: 'Environment ID',
  [PATH_VALUES.CONTENT_TYPE]: 'Content Type ID',
  [PATH_VALUES.ENTITY]: 'Entity ID'
};

export default class Filters extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    filters: PropTypes.array.isRequired
  }

  state = {
    filters: this.props.filters
  }

  addNew () {
    this.setState({
      filters: this.state.filters.concat([{
        constraint: 0,
        path: PATH_VALUES.ENVIRONMENT,
        value: ''
      }])
    });
  }

  getPlaceholder (constraint) {
    if (CONSTRAINT_TYPES[constraint].name === CONSTRAINT_NAMES.IN) {
      return 'comma separated values e.g: 1,2,3 or a,b,c';
    }

    if (CONSTRAINT_TYPES[constraint].name === CONSTRAINT_NAMES.REGEXP) {
      return 'valid regular expression e.g: [a-z]+';
    }

    return '';
  }

  onChange (filters) {
    setTimeout(() => this.props.onChange(filters), 1);
  }

  updateByIndex (index, updateObj) {
    this.setState(state => {
      const filters = [ ...state.filters ];
      filters[index] = {...filters[index], ...updateObj};

      this.onChange(filters);

      return { filters };
    });
  }

  removeByIndex (index) {
    this.setState(state => {
      const filters = state.filters
            .slice(0, index)
            .concat(state.filters.slice(index + 1));

      this.onChange(filters);

      return { filters };
    });
  }

  renderConstraintOption (constraint, index) {
    let caption = constraint.name;
    if (constraint.negated) {
      caption = 'not ' + constraint.name;
    }

    return (
      <option key={index} value={index}>
        {caption}
      </option>
    );
  }

  renderFilter (filter, index) {
    return (
      <div key={index} className="webhook-filter">
        <select onChange={e => this.updateByIndex(index, { path: e.target.value })}
                className="cfnext-select-box path-select"
          value={filter.path}>

          {PATHS.map(p => <option key={p} value={p}>{PATH_TITLES[p]} ({p})</option>)}
        </select>

        <select onChange={e => this.updateByIndex(index, { constraint: e.target.value })}
                className="cfnext-select-box constraint-select"
                value={filter.constraint}>
          {CONSTRAINT_TYPES.map(this.renderConstraintOption.bind(this))}
        </select>

        <input onChange={e => this.updateByIndex(index, { value: e.target.value })}
               placeholder={this.getPlaceholder(filter.constraint)}
               className="cfnext-form__input value-input"
               type="text"
               value={filter.value} />

        <button className="btn-link" onClick={() => this.removeByIndex(index)}>
          <i className="fa fa-trash"></i>
        </button>
      </div>
    );
  }

  renderCaption () {
    let caption = 'No filters added currently. This webhook will trigger for any content, based on your selection of events.';
    if (this.state.filters.length) {
      caption = 'This webhook will trigger for only the content that matches the filters defined below.';
    }

    return (
      <label>{caption}</label>
    );
  }

  render () {
    return (
      <div className="webhook-filters">

        <div className="webhook-filters-title">
          <label><strong>Filters</strong></label>
          {this.renderCaption()}
        </div>

        {this.state.filters.map(this.renderFilter.bind(this))}

        <div>
          <button className="btn-link add-filter-btn" onClick={() => this.addNew()}>
            + Add Filter
          </button>
        </div>

      </div>
    );
  }
}
