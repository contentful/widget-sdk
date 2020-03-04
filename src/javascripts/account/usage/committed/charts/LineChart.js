/* eslint "rulesdir/restrict-inline-styles": "warn" */
import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { merge, update, flow, isArray } from 'lodash/fp';
import * as echarts from 'echarts';

import baseStyle, { seriesBaseStyle } from './lineChartBaseStyle';
import { Spinner } from '@contentful/forma-36-react-components';

export default class LineChart extends React.Component {
  static propTypes = {
    options: PropTypes.object.isRequired,
    empty: PropTypes.bool,
    EmptyPlaceholder: PropTypes.func,
    loading: PropTypes.bool.isRequired,
    className: PropTypes.string,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    require: PropTypes.shape({ ensure: PropTypes.func })
  };

  static defaultProps = {
    className: null,
    empty: false,
    EmptyPlaceholder: null,
    width: '700px',
    height: '300px',
    require: null
  };

  constructor(props) {
    super(props);

    this.chartRef = React.createRef();
  }

  componentDidMount() {
    this.chartInstance = echarts.init(this.chartRef.current, null, {
      renderer: 'svg'
    });

    this.setChartOptions();
  }

  componentDidUpdate() {
    if (this.chartInstance) {
      this.setChartOptions();
    }
  }

  setChartOptions() {
    const { options, empty } = this.props;
    if (!empty) {
      this.chartInstance.setOption(
        flow(
          merge(baseStyle),
          update('series', series =>
            isArray(series) ? series.map(merge(seriesBaseStyle)) : merge(seriesBaseStyle, series)
          )
        )(options)
      );
    }
  }

  render() {
    const { EmptyPlaceholder, empty, className, width, height, loading } = this.props;
    return (
      <div
        className={cn(
          'line-chart',
          {
            'line-chart--empty': empty,
            'line-chart--loading': loading
          },
          className
        )}
        style={{
          width,
          height
        }}>
        <div
          className={'line-chart__mount'}
          ref={this.chartRef}
          style={{
            width,
            height
          }}
        />
        {!loading && empty && (EmptyPlaceholder ? <EmptyPlaceholder /> : <div>Empty</div>)}
        {loading && <Spinner />}
      </div>
    );
  }
}
