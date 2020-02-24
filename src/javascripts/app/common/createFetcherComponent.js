import React from 'react';
import PropTypes from 'prop-types';

export class DelayedLoading extends React.Component {
  static propTypes = {
    delay: PropTypes.number.isRequired,
    children: PropTypes.node
  };

  static defaultProps = {
    delay: 300
  };

  state = {
    display: false
  };

  constructor(props) {
    super(props);
    this.timer = setTimeout(this.display, props.delay);
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  display = () => {
    this.setState({ display: true });
  };

  render() {
    const { display } = this.state;
    if (!display) {
      return null;
    }
    return this.props.children;
  }
}

export const FetcherLoading = ({ message }) => (
  <DelayedLoading>
    <div className="loading-box--stretched">
      <div className="loading-box__spinner" />
      <div className="loading-box__message">{message || 'Loading...'}</div>
    </div>
  </DelayedLoading>
);

FetcherLoading.propTypes = {
  message: PropTypes.string
};

const createFetcherComponent = mapPropsToFetch => {
  return class extends React.Component {
    static displayName = 'FetcherComponent';

    static propTypes = {
      children: PropTypes.func.isRequired
    };

    _isMounted = false;

    state = {
      isLoading: true,
      isLoaded: false,
      isError: false,
      data: null,
      error: null
    };

    componentDidMount() {
      this._isMounted = true;
      this.fetch();
    }

    componentWillUnmount() {
      this._isMounted = false;
    }

    fetch = () => {
      this.setState({ isLoading: true });
      mapPropsToFetch(this.props)
        .then(data => {
          if (this._isMounted) {
            this.setState({ isLoading: false, isLoaded: true, isError: false, data, error: null });
          }
        })
        .catch(error => {
          if (this._isMounted) {
            this.setState({ isLoading: false, isLoaded: false, isError: true, data: null, error });
          }
        });
    };

    render() {
      return this.props.children({
        ...this.state,
        fetch: this.fetch.bind(this)
      });
    }
  };
};

export default createFetcherComponent;
