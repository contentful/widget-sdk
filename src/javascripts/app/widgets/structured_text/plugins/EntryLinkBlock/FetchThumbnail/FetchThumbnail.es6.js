import React from 'react';
import PropTypes from 'prop-types';

import RequestStatus from '../../shared/RequestStatus.es6';

export default class FetchThumbnail extends React.Component {
  static propTypes = {
    entry: PropTypes.object,
    currentUrl: PropTypes.string,
    render: PropTypes.func.isRequired,
    $services: PropTypes.shape({
      spaceContext: PropTypes.object
    }).isRequired
  };
  state = {
    thumbnail: null,
    requestStatus: RequestStatus.Pending
  };
  componentDidMount() {
    this.fetchThumbnail(this.props);
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.currentUrl !== nextProps.currentUrl || this.props.entry !== nextProps.entry) {
      this.fetchThumbnail(nextProps);
    }
  }
  fetchThumbnail = async props => {
    try {
      if (!props.entry) {
        return;
      }
      const spaceContext = props.$services.spaceContext;
      this.setState({
        thumbnail: null,
        requestStatus: RequestStatus.Pending
      });
      const thumbnail = await spaceContext.entryImage(props.entry);
      this.setState({
        thumbnail,
        requestStatus: RequestStatus.Success
      });
    } catch (error) {
      this.setState({
        thumbnail: null,
        requestStatus: RequestStatus.Error
      });
    }
  };
  render() {
    return this.props.render(this.state);
  }
}
