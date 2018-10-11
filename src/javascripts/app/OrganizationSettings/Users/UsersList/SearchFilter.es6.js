import React from 'react';
import PropTypes from 'prop-types';

export default class SearchFilter extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    filter: PropTypes.shape({
      key: PropTypes.string.isRequired,
      value: PropTypes.any,
      operator: PropTypes.string
    }),
    options: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.any
      })
    ),
    onChange: PropTypes.func
  };

  handleChange = ({ target: { value } }) => {
    const { onChange, filter } = this.props;

    onChange &&
      onChange({
        ...filter,
        value
      });
  };

  getSelectWidth() {
    const { filter, options } = this.props;
    const selected = options.find(option => option.value === filter.value);
    return `calc(${selected.label.length}ch + 40px)`;
  }

  render() {
    const { label, filter, options } = this.props;
    return (
      <div className="search__filter-pill users-search__filter-pill">
        <div className="search__filter-pill-label users-search__filter-pill-label">{label}</div>
        <div className="search__select-value">
          <select
            className="search__select"
            value={filter.value}
            onChange={this.handleChange}
            style={{ width: this.getSelectWidth() }}>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
}
