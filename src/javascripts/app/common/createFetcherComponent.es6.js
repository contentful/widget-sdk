import React from 'react';
import PropTypes from 'prop-types';

export const FetcherLoading = ({ message }) => (
  <div className="loading-box--stretched">
    <div className="loading-box__spinner" />
    <div className="loading-box__message">{message || 'Loading...'}</div>
  </div>
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

    state = {
      isLoading: true,
      isLoaded: false,
      isError: false,
      data: null,
      error: null
    };

    componentDidMount() {
      this.fetch();
    }

    fetch = () => {
      this.setState({ isLoading: true });
      mapPropsToFetch(this.props)
        .then(data => {
          this.setState({ isLoading: false, isLoaded: true, isError: false, data, error: null });
        })
        .catch(error => {
          this.setState({ isLoading: false, isLoaded: false, isError: true, data: null, error });
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
