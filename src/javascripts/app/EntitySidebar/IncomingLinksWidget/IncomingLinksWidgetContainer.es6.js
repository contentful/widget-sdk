import React, { Component } from 'react';
import PropTypes from 'prop-types';
import IncomingLinksWidget from './IncomingLinksWidget.es6';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';

export default class IncomingLinksWidgetContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    entityInfo: null
  };

  componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_INCOMING_LINKS_WIDGET, this.onUpdateEntityInfo);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.INCOMING_LINKS);
  }
  componentWillUnmount() {
    this.props.emitter.off(
      SidebarEventTypes.UPDATED_INCOMING_LINKS_WIDGET,
      this.onUpdateEntityInfo
    );
  }

  onUpdateEntityInfo = ({ entityInfo }) => {
    this.setState({ entityInfo });
  };

  render() {
    return <IncomingLinksWidget entityInfo={this.state.entityInfo} />;
  }
}
