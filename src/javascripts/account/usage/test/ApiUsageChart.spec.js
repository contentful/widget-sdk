import React from 'react';
import { shallow } from 'enzyme';
import moment from 'moment';
import { LineChart } from '@contentful/ui-component-library';
import { shorten } from 'utils/NumberUtils.es6';
import sinon from 'sinon';

import ApiUsageChart from '../committed/ApiUsageChart.es6';
import EmptyChartPlaceholder from '../committed/EmptyChartPlaceholder.es6';

describe('ApiUsageChart', () => {
  let clock = null;
  let testStartDate = null;

  beforeAll(() => {
    // set fixed date for stable snapshots
    clock = sinon.useFakeTimers(moment('2017-12-01').unix());
    testStartDate = moment().subtract(3, 'days');
  });

  afterAll(() => {
    clock.restore();
  });

  const renderChart = (
    startDate = testStartDate,
    isLoading = false,
    colors = ['#000'],
    spaceNames = { space1: 'test space' },
    usage = [
      {
        sys: {
          id: '1',
          type: 'ApiUsage',
          space: { sys: { id: 'space1' } }
        },
        usage: [1, 2, 3]
      },
      {
        sys: {
          id: '2',
          type: 'ApiUsage',
          space: { sys: { id: 'space2' } }
        },
        usage: [0, 1, 2]
      }
    ]
  ) =>
    shallow(
      <ApiUsageChart
        period={{
          startDate: startDate.toISOString(),
          endDate: null
        }}
        usage={usage}
        isLoading={isLoading}
        colors={colors}
        spaceNames={spaceNames}
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

  it('should set non-accumulated usage', () => {
    expect(
      renderChart()
        .find(LineChart)
        .prop('options').series[0].data
    ).toEqual([1, 2, 3]);
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
  });

  describe('is current period and less than three days old', () => {
    it('should show empty placeholder in chart', () => {
      const chart = renderChart(moment().subtract(2, 'days'));
      expect(chart.find(LineChart).prop('empty')).toBe(true);
      expect(chart.find(LineChart).prop('EmptyPlaceholder')).toBe(EmptyChartPlaceholder);
    });
  });

  describe('is loading', () => {
    it('should show chart as loading', () => {
      expect(
        renderChart(undefined, true)
          .find(LineChart)
          .prop('loading')
      ).toBe(true);
    });
  });

  describe('custom colors', () => {
    it('should use colors for given (two) series in order', () => {
      expect(
        renderChart(undefined, undefined, ['#111', '#222', '#333'])
          .find(LineChart)
          .prop('options')
          .series.map(({ itemStyle: { color } }) => color)
      ).toEqual(['#111', '#222']);
    });
  });

  describe('some space names available', () => {
    it('should set space name or placeholder as series name', () => {
      expect(
        renderChart(undefined, undefined, undefined, { space1: 'Space1', space3: 'Space3' })
          .find(LineChart)
          .prop('options')
          .series.map(({ name }) => name)
      ).toEqual(['Space1', 'deleted space']);
    });
  });

  describe('given usage for two spaces', () => {
    it('should include usage in series data', () => {
      expect(
        renderChart()
          .find(LineChart)
          .prop('options')
          .series.map(({ data }) => data)
      ).toEqual([[1, 2, 3], [0, 1, 2]]);
    });

    it('should use specific symbols for each usage', () => {
      expect(
        renderChart()
          .find(LineChart)
          .prop('options')
          .series.map(({ symbol }) => symbol)
      ).toEqual(['circle', 'diamond']);
    });

    it('should render custom tooltip as html string', () => {
      expect(
        renderChart()
          .find(LineChart)
          .prop('options')
          .tooltip.formatter([{ name: 'test-name', value: '2' }])
      ).toContain('<div class="date">test-name</div>');
    });
  });
});
