import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@contentful/ui-component-library';
import classnames from 'classnames';

export default class EChart extends React.Component {
  static propTypes = {
    options: PropTypes.object.isRequired,
    isEmpty: PropTypes.bool,
    EmptyPlaceholder: PropTypes.func
  };

  static defaultProps = {
    isEmpty: false,
    EmptyPlaceholder: null
  };

  constructor(props) {
    super(props);

    this.state = { isLoading: true };
  }

  setChartOptions() {
    const { options, isEmpty } = this.props;
    !isEmpty && this.chartInstance.setOption(options);
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
        this.setState({ isLoading: false });
        this.setChartOptions();
      },
      'echarts'
    );
  }

  render() {
    const { EmptyPlaceholder, isEmpty } = this.props;
    const { isLoading } = this.state;
    return (
      <React.Fragment>
        <div
          ref={ref => {
            this.ref = ref;
          }}
          className={classnames('echart', {
            'echart--loading': isLoading,
            'echart--empty': isEmpty
          })}>
          {isLoading && <Spinner />}
        </div>
        {isEmpty && <EmptyPlaceholder />}
      </React.Fragment>
    );
  }
}
