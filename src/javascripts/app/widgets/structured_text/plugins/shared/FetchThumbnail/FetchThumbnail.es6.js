import React from 'react';
import PropTypes from 'prop-types';

import RequestStatus from '../RequestStatus.es6';

export default class FetchThumbnail extends React.Component {
  static propTypes = {
    // TODO: Add `locale` prop.
    entry: PropTypes.object,
    currentUrl: PropTypes.string,
    render: PropTypes.func.isRequired,
    $services: PropTypes.shape({
      // TODO: Use `widgetApi` and `EntityHelpers` instead.
      spaceContext: PropTypes.object
    }).isRequired
  };
  state = {
    thumbnail: null,
    requestStatus: RequestStatus.Pending
  };
  componentDidMount() {
    this.fetchThumbnail();
  }
  componentDidUpdate(prevProps) {
    if (this.props.currentUrl !== prevProps.currentUrl || this.props.entry !== prevProps.entry) {
      this.fetchThumbnail();
    }
  }
  fetchThumbnail = async () => {
    try {
      if (!this.props.entry) {
        return;
      }
      const spaceContext = this.props.$services.spaceContext;
      this.setState({
        thumbnail: null,
        requestStatus: RequestStatus.Pending
      });
      const thumbnail = await spaceContext.entryImage(this.props.entry);
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
