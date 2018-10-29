import React, { Component } from 'react';
import { DropdownListItem } from '@contentful/ui-component-library';
import { INLINES } from '@contentful/rich-text-types';

import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import { selectEntryAndInsert, canInsertInline } from './Utils.es6';
import { actionOrigin, TOOLBAR_PLUGIN_PROP_TYPES } from '../shared/PluginApi.es6';

export default class EntryLinkToolbarIcon extends Component {
  static propTypes = TOOLBAR_PLUGIN_PROP_TYPES;

  handleMouseDown = async (event, widgetAPI) => {
    event.preventDefault();
    const {
      change,
      richTextAPI: { logAction }
    } = this.props;
    const logToolbarAction = (name, data) =>
      logAction(name, { origin: actionOrigin.TOOLBAR, ...data });
    await selectEntryAndInsert(widgetAPI, change, logToolbarAction);
    this.props.onToggle(change);
  };
  render() {
    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) => (
          <DropdownListItem
            isDisabled={this.props.disabled || !canInsertInline(this.props.change)}
            extraClassNames="rich-text__entry-link-block-button"
            size="small"
            icon="Entry"
            buttonType="muted"
            testId={`toolbar-toggle-${INLINES.EMBEDDED_ENTRY}`}
            onMouseDown={event => this.handleMouseDown(event, widgetAPI)}>
            Embed inline entry
          </DropdownListItem>
        )}
      </WidgetAPIContext.Consumer>
    );
  }
}
