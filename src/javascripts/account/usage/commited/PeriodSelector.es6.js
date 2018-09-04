import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { periodPropType } from './propTypes.es6';

const formatDate = date => moment(date).format('DD MMM');

export default class PeriodSelector extends React.Component {
  static propTypes = {
    periods: PropTypes.arrayOf(periodPropType).isRequired,
    selectedPeriodIndex: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
  };

  render() {
    const { periods, onChange, selectedPeriodIndex } = this.props;
    return (
      <span className="usage__period-selector">
        <label>Usage period</label>
        <select
          className="cfnext-select-box"
          defaultValue={selectedPeriodIndex}
          onChange={onChange}>
          {periods.map(({ startDate, endDate }, index) => {
            const isCurrentPeriod = index === 0;
            const start = moment(startDate);
            const end = endDate
              ? moment(endDate)
              : moment(start)
                  .add(1, 'month')
                  .subtract(1, 'day');

            return (
              <option key={index} value={index}>{`${formatDate(start)} – ${formatDate(end)}${
                end.year() !== moment().year() ? ` ${end.year()}` : ''
              }${isCurrentPeriod ? ` (current)` : ''}`}</option>
            );
          })}
        </select>
      </span>
    );
  }
}
