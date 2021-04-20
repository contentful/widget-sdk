import React, { Component } from 'react';
import PropTypes from 'prop-types';
import IncomingLinksWidget from './IncomingLinksWidget';
import SidebarEventTypes from '../SidebarEventTypes';
import SidebarWidgetTypes from '../SidebarWidgetTypes';

export default class IncomingLinksWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired,
  };

  state = {
    entityInfo: null,
    incomingLinksResponse: null,
  };

  componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_INCOMING_LINKS_WIDGET, this.linksUpdateHandler);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.INCOMING_LINKS);
  }
  componentWillUnmount() {
    this.props.emitter.off(
      SidebarEventTypes.UPDATED_INCOMING_LINKS_WIDGET,
      this.linksUpdateHandler
    );
  }

  linksUpdateHandler = ({ entityInfo, incomingLinksResponse }) => {
    this.setState({ entityInfo, incomingLinksResponse });
  };

  render() {
    if (!this.state.entityInfo || !this.state.incomingLinksResponse) {
      return null;
    }
    return (
      <IncomingLinksWidget
        entityInfo={this.state.entityInfo}
        incomingLinksResponse={this.state.incomingLinksResponse}
      />
    );
  }
}
