import React from 'react';
import PropTypes from 'prop-types';

import { CONSTRAINT_TYPES, CONSTRAINT_NAMES, PATH_VALUES, PATHS } from './WebhookFiltersState';

const PATH_TITLES = {
  [PATH_VALUES.ENVIRONMENT]: 'Environment ID',
  [PATH_VALUES.CONTENT_TYPE]: 'Content Type ID',
  [PATH_VALUES.ENTITY]: 'Entity ID'
};

const NO_FILTERS_MSG =
  'No filters defined. This webhook will trigger for any entity, based on your selection of triggering events.';
const HAS_FILTERS_MSG =
  'This webhook will trigger only for entities matching the filters defined below.';

export default class WebhookFilters extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    filters: PropTypes.array.isRequired
  };

  componentDidUpdate() {
    if (this.shouldFocus && this.el) {
      const inputs = this.el.querySelectorAll('input');
      inputs[inputs.length - 1].focus(); // focus the value of the last filter
    }
    this.shouldFocus = false;
  }

  addNew() {
    this.shouldFocus = true; // focus newly added filter when updated
    const { filters, onChange } = this.props;
    const newlyAdded = { constraint: 0, path: PATH_VALUES.ENVIRONMENT, value: '' };
    const updated = filters.concat([newlyAdded]);
    onChange(updated);
  }

  updateByIndex(index, updateObj) {
    const { filters, onChange } = this.props;
    const updated = [...filters];
    updated[index] = { ...updated[index], ...updateObj };
    onChange(updated);
  }

  removeByIndex(index) {
    const { filters, onChange } = this.props;
    const updated = filters.slice(0, index).concat(filters.slice(index + 1));
    onChange(updated);
  }

  renderConstraintOption(constraint, index) {
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

  renderFilter(filter, index) {
    return (
      <div key={index} className="webhook-editor__settings-row">
        <select
          onChange={e => this.updateByIndex(index, { path: e.target.value })}
          className="cfnext-select-box"
          value={filter.path}>
          {PATHS.map(p => (
            <option key={p} value={p}>
              {PATH_TITLES[p]} ({p})
            </option>
          ))}
        </select>

        <select
          onChange={e => this.updateByIndex(index, { constraint: e.target.value })}
          className="cfnext-select-box"
          value={filter.constraint}>
          {CONSTRAINT_TYPES.map(this.renderConstraintOption)}
        </select>

        <input
          onChange={e => this.updateByIndex(index, { value: e.target.value })}
          placeholder={this.getPlaceholder(filter.constraint)}
          className="cfnext-form__input"
          type="text"
          value={filter.value}
        />

        <button className="btn-link" onClick={() => this.removeByIndex(index)}>
          Remove
        </button>
      </div>
    );
  }

  render() {
    const { filters } = this.props;

    return (
      <div
        className="cfnext-form__field"
        ref={el => {
          this.el = el;
        }}>
        <label>Filters</label>
        <p>{filters.length > 0 ? HAS_FILTERS_MSG : NO_FILTERS_MSG}</p>

        {filters.map((f, i) => this.renderFilter(f, i))}

        <button className="btn-link" onClick={() => this.addNew()}>
          + Add filter
        </button>
      </div>
    );
  }

  getPlaceholder(constraint) {
    if (CONSTRAINT_TYPES[constraint].name === CONSTRAINT_NAMES.IN) {
      return 'comma separated values';
    }

    if (CONSTRAINT_TYPES[constraint].name === CONSTRAINT_NAMES.REGEXP) {
      return 'valid regular expression, for example [a-z]+';
    }

    return '';
  }
}
