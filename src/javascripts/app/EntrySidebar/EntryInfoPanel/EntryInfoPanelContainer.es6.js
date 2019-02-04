import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import EntryInfoPanel from './EntryInfoPanel.es6';

export default class EntryInfoPanelContainer extends Component {
  static propTypes = {
    emitter: PropTypes.object.isRequired
  };

  state = {
    isVisible: false,
    sys: null,
    contentType: null
  };

  componentDidMount() {
    this.props.emitter.on(SidebarEventTypes.UPDATED_INFO_PANEL, this.onUpdate);
    this.props.emitter.emit(SidebarEventTypes.WIDGET_REGISTERED, SidebarWidgetTypes.INFO_PANEL);
  }
  componentWillUnmount() {
    this.props.emitter.off(SidebarEventTypes.UPDATED_INFO_PANEL, this.onUpdate);
  }

  onUpdate = update => {
    const { sys } = update;

    this.setState(state => ({
      ...state,
      ...update,
      sys: sys ? { ...state.sys, ...sys } : state.sys
    }));
  };

  render() {
    const props = {
      isVisible: this.state.isVisible,
      sys: this.state.sys
    };

    if (this.state.contentType) {
      props.contentTypeName = this.state.contentType.name || 'Untitled';
      props.contentTypeDescription = this.state.contentType.description;
      props.contentTypeId = this.state.contentType.sys.id;
    }

    return <EntryInfoPanel {...props} />;
  }
}
