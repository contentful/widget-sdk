import React from 'react';
import moment from 'moment';
import { Select, Option } from '@contentful/forma-36-react-components';
import { cond, constant, stubTrue } from 'lodash';
import { track } from 'analytics/Analytics';
import { useUsageState, useUsageDispatch } from '../hooks/usageContext';
import { pick } from 'lodash/fp';
import { loadPeriodData } from '../services/UsageService';

const formatDate = (date) => moment(date).format('DD MMM');

export const PeriodSelector = () => {
  const { periods, selectedPeriodIndex, orgId, isTeamOrEnterpriseCustomer } = useUsageState();
  const dispatch = useUsageDispatch();

  const handleChange = async (e) => {
    dispatch({ type: 'SET_LOADING', value: true });

    const newPeriodIndex = parseInt(e.target.value);

    // analytics
    const oldPeriod = periods[selectedPeriodIndex];
    const newPeriod = periods[newPeriodIndex];
    track('usage:period_selected', {
      oldPeriod: pick(['startDate', 'endDate'], oldPeriod),
      newPeriod: pick(['startDate', 'endDate'], newPeriod),
    });

    dispatch({ type: 'CHANGE_PERIOD', value: newPeriodIndex });
    dispatch({ type: 'SWITCH_MAIN_TAB', value: 'apiRequest' });
    const data = await loadPeriodData(orgId, newPeriod);
    dispatch({ type: 'SET_USAGE_DATA', value: data });
    dispatch({ type: 'SET_LOADING', value: false });
  };

  const processDate = (startDate, endDate) => {
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
  };

  const renderSelect = () => {
    return (
      <Select
        defaultValue={selectedPeriodIndex}
        onChange={handleChange}
        width="auto"
        name="period-selector"
        testId="period-selector"
        id="period-selector">
        {periods.map(({ startDate, endDate }, index) => {
          const value = `${index}`;

          return (
            <Option key={index} value={value}>
              {processDate(startDate, endDate)}
            </Option>
          );
        })}
      </Select>
    );
  };

  const renderCurrentPeriodTextOnly = () => {
    const { startDate, endDate } = periods[0];
    return <strong data-test-id="usage-period-text">{processDate(startDate, endDate)}</strong>;
  };

  return (
    <div className="usage__period-selector">
      <label>API requests usage period</label>
      {isTeamOrEnterpriseCustomer ? renderSelect() : renderCurrentPeriodTextOnly()}
    </div>
  );
};
