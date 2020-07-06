import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Select, Option } from '@contentful/forma-36-react-components';
import { cond, constant, stubTrue } from 'lodash';

import { periodPropType } from './propTypes';

const formatDate = (date) => moment(date).format('DD MMM');

export class PeriodSelector extends React.Component {
  static propTypes = {
    periods: PropTypes.arrayOf(periodPropType).isRequired,
    selectedPeriodIndex: PropTypes.number,
    onChange: PropTypes.func.isRequired,
    isTeamOrEnterpriseCustomer: PropTypes.bool,
  };

  processDate(startDate, endDate) {
    const isCurrentPeriod = endDate === null || moment().diff(moment(endDate), 'days') == 0; // the end day is today
    const start = moment(startDate);
    const end = isCurrentPeriod
      ? moment(start).add(1, 'month').subtract(1, 'day')
      : moment(endDate);
    return `${formatDate(start)} – ${formatDate(end)} ${cond([
      [constant(isCurrentPeriod), constant('(current)')],
      [constant(end.year() === moment().year()), constant(`(${moment().to(start)})`)],
      [constant(stubTrue), constant(end.year())],
    ])()}`;
  }

  renderSelect() {
    const { periods, onChange, selectedPeriodIndex } = this.props;
    return (
      <Select
        defaultValue={selectedPeriodIndex}
        onChange={onChange}
        width="auto"
        name="period-selector"
        id="period-selector">
        {periods.map(({ startDate, endDate }, index) => {
          const value = `${index}`;

          return (
            <Option key={index} value={value}>
              {this.processDate(startDate, endDate)}
            </Option>
          );
        })}
      </Select>
    );
  }

  renderCurrentPeriodTextOnly() {
    const { periods } = this.props;
    const { startDate, endDate } = periods[0];
    return <strong data-test-id="usage-period-text">{this.processDate(startDate, endDate)}</strong>;
  }

  render() {
    const { isTeamOrEnterpriseCustomer } = this.props;
    return (
      <div className="usage__period-selector">
        <label>API requests usage period</label>
        {isTeamOrEnterpriseCustomer ? this.renderSelect() : this.renderCurrentPeriodTextOnly()}
      </div>
    );
  }
}
