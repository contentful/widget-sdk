import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@contentful/ui-component-library';

export default class EChart extends React.Component {
  static propTypes = {
    options: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
    height: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);

    this.state = { loading: true };
  }

  setChartOptions() {
    const { options } = this.props;
    this.chartInstance.setOption(options);
  }

  componentDidUpdate() {
    this.setChartOptions();
  }

  componentDidMount() {
    require.ensure(
      ['echarts'],
      require => {
        const echarts = require('echarts');
        this.chartInstance = echarts.init(this.ref, null, { renderer: 'svg' });
        this.setState({ loading: false });
        this.setChartOptions();
      },
      'echarts'
    );
  }

  render() {
    const { loading } = this.state;
    const { width, height } = this.props;
    return (
      <div
        style={{ width, height }}
        ref={ref => {
          this.ref = ref;
        }}
        className={`echart${loading ? ' echart--loading' : ''}`}>
        {loading && <Spinner />}
      </div>
    );
  }
}
