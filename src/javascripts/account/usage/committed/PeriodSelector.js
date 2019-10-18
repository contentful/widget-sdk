import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Select, Option } from '@contentful/forma-36-react-components';
import { cond, constant, stubTrue } from 'lodash';

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
        <Select
          defaultValue={selectedPeriodIndex}
          onChange={onChange}
          width="auto"
          name="period-selector"
          id="period-selector">
          {periods.map(({ startDate, endDate }, index) => {
            const isCurrentPeriod = endDate === null;
            const start = moment(startDate);
            const end = isCurrentPeriod
              ? moment(start)
                  .add(1, 'month')
                  .subtract(1, 'day')
              : moment(endDate);

            const value = `${index}`;

            return (
              <Option key={index} value={value}>{`${formatDate(start)} – ${formatDate(end)} ${cond([
                [constant(isCurrentPeriod), constant('(current)')],
                [constant(end.year() === moment().year()), constant(`(${moment().to(start)})`)],
                [constant(stubTrue), constant(end.year())]
              ])()}`}</Option>
            );
          })}
        </Select>
      </span>
    );
  }
}
