import React from 'react';
import { shallow } from 'enzyme';
import moment from 'moment';
import { LineChart } from '@contentful/forma-36-react-components';
import { shorten } from 'utils/NumberUtils.es6';

import OrganisationUsageChart from '../committed/OrganisationUsageChart.es6';
import EmptyChartPlaceholder from '../committed/EmptyChartPlaceholder.es6';

const DATE_FORMAT = 'YYYY-MM-DD';

describe('OrganizationUsageChart', () => {
  let testStartDate = null;

  beforeAll(() => {
    // set fixed date for stable snapshots
    // moment('2017-12-01').unix() = 1512082800
    jest.spyOn(Date, 'now').mockImplementation(() => 1512082800);
    testStartDate = moment().subtract(3, 'days');
  });

  afterAll(() => {
    Date.now.mockRestore();
  });

  const renderChart = (includedLimit = 2000) =>
    shallow(
      <OrganisationUsageChart
        period={{
          startDate: testStartDate.format(DATE_FORMAT),
          endDate: null
        }}
        usage={[1, 2, 3]}
        includedLimit={includedLimit}
        isLoading={false}
      />
    );

  it('should render line chart and not throw errors', () => {
    const chart = renderChart();
    expect(chart.find(LineChart)).toHaveLength(1);

    expect(chart).toMatchSnapshot();
  });

  it('should not show chart as loading', () => {
    // note that the chart will be shown as loading anyways while it's loading `echarts` internally
    expect(
      renderChart()
        .find(LineChart)
        .prop('loading')
    ).toBe(false);
  });

  it('should not show empty placeholder in chart', () => {
    expect(
      renderChart()
        .find(LineChart)
        .prop('empty')
    ).toBe(false);
  });

  it('should accumulate usage', () => {
    expect(
      renderChart()
        .find(LineChart)
        .prop('options').series.data
    ).toEqual([1, 3, 6]);
  });

  it('should format dates as expected', () => {
    expect(
      renderChart()
        .find(LineChart)
        .prop('options').xAxis.data[0]
    ).toBe(testStartDate.format('D MMM'));
  });

  it('should shorten numbers', () => {
    expect(
      renderChart()
        .find(LineChart)
        .prop('options').yAxis.axisLabel.formatter
    ).toBe(shorten);
    expect(
      renderChart()
        .find(LineChart)
        .prop('options').visualMap.pieces[1].label
    ).toBe('exceeding 2K limit');
  });

  describe('limit higher than highest accumulated value', () => {
    it('should set limit as yAxis max', () => {
      expect(
        renderChart(7)
          .find(LineChart)
          .prop('options').yAxis.max
      ).toBe(7);
    });
  });

  describe('limit lower than highest accumulated value', () => {
    it('should set last accumulated value as yAxis max', () => {
      expect(
        renderChart(5)
          .find(LineChart)
          .prop('options').yAxis.max
      ).toBe(6);
    });
  });

  describe('is current period and less than three days old', () => {
    const renderChart = () =>
      shallow(
        <OrganisationUsageChart
          period={{
            startDate: moment()
              .subtract(2, 'days')
              .format(DATE_FORMAT),
            endDate: null
          }}
          usage={[]}
          includedLimit={0}
          isLoading={false}
        />
      );

    it('should show empty placeholder in chart', () => {
      expect(
        renderChart()
          .find(LineChart)
          .prop('empty')
      ).toBe(true);
      expect(
        renderChart()
          .find(LineChart)
          .prop('EmptyPlaceholder')
      ).toBe(EmptyChartPlaceholder);
    });
  });

  describe('is loading', () => {
    const renderChart = () =>
      shallow(
        <OrganisationUsageChart
          period={{
            startDate: moment()
              .subtract(12, 'days')
              .format(DATE_FORMAT),
            endDate: null
          }}
          usage={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
          includedLimit={0}
          isLoading={true}
        />
      );

    it('should show chart as loading', () => {
      expect(
        renderChart()
          .find(LineChart)
          .prop('loading')
      ).toBe(true);
    });
  });
});
