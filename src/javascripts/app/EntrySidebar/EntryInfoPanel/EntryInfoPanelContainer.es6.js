import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarEventTypes from '../SidebarEventTypes.es6';
import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import EntryInfoPanel from './EntryInfoPanel.es6';
import { omit } from 'lodash';

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

    // we only get updated properties in sys, not the complete object
    if (sys) {
      this.setState({ sys: { ...this.state.sys, ...sys } });
    }

    this.setState(state => ({ ...state, ...omit(update, ['sys']) }));
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
