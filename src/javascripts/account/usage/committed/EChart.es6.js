import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@contentful/ui-component-library';
import classnames from 'classnames';

export default class EChart extends React.Component {
  static propTypes = {
    options: PropTypes.object.isRequired,
    isEmpty: PropTypes.bool,
    EmptyPlaceholder: PropTypes.func,
    isLoading: PropTypes.bool.isRequired,
    additionalClassnames: PropTypes.string
  };

  static defaultProps = {
    additionalClassnames: null
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
    const { EmptyPlaceholder, isEmpty, additionalClassnames } = this.props;
    const isLoading = this.state.isLoading || this.props.isLoading;
    return (
      <React.Fragment>
        <div
          ref={ref => {
            this.ref = ref;
          }}
          className={classnames('echart', {
            'echart--loading': isLoading,
            'echart--empty': isEmpty,
            [additionalClassnames]: !!additionalClassnames
          })}
        />
        {!isLoading && isEmpty && <EmptyPlaceholder />}
        {isLoading && (
          <div className="echart echart__spinner">
            <Spinner />
          </div>
        )}
      </React.Fragment>
    );
  }
}
