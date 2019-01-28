import React, { Component } from 'react';
import { INLINES } from '@contentful/rich-text-types';
import ToolbarIcon from '../shared/ToolbarIcon.es6';
import { TOOLBAR_PLUGIN_PROP_TYPES } from '../shared/PluginApi.es6';
import { hasHyperlink, toggleLink, hasOnlyHyperlinkInlines } from './Util.es6';

export default class HyperlinkToolbarIcon extends Component {
  static propTypes = TOOLBAR_PLUGIN_PROP_TYPES;

  handleClick = async event => {
    event.preventDefault();
    const {
      onToggle,
      change,
      richTextAPI: { widgetAPI, logToolbarAction }
    } = this.props;
    await toggleLink(change, widgetAPI.dialogs.createHyperlink, logToolbarAction);
    onToggle(change);
  };

  render() {
    const { disabled, change } = this.props;
    const isDisabled = disabled || !hasOnlyHyperlinkInlines(change.value);
    return (
      <ToolbarIcon
        disabled={isDisabled}
        type={INLINES.HYPERLINK}
        icon="Link"
        title="Hyperlink"
        onToggle={event => this.handleClick(event)}
        isActive={hasHyperlink(change.value)}
      />
    );
  }
}
