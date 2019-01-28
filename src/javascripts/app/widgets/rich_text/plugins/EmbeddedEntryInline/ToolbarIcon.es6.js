import React, { Component } from 'react';
import { DropdownListItem, Icon, Button } from '@contentful/forma-36-react-components';
import { INLINES } from '@contentful/rich-text-types';

import WidgetAPIContext from 'app/widgets/WidgetApi/WidgetApiContext.es6';
import { selectEntryAndInsert, canInsertInline } from './Utils.es6';
import { TOOLBAR_PLUGIN_PROP_TYPES } from '../shared/PluginApi.es6';

export default class EntryLinkToolbarIcon extends Component {
  static propTypes = TOOLBAR_PLUGIN_PROP_TYPES;

  static defaultProps = {
    isButton: false
  };
  handleClick = async (event, widgetAPI) => {
    event.preventDefault();
    const {
      change,
      richTextAPI: { logToolbarAction }
    } = this.props;
    await selectEntryAndInsert(widgetAPI, change, logToolbarAction);
    this.props.onToggle(change);
  };
  render() {
    return (
      <WidgetAPIContext.Consumer>
        {({ widgetAPI }) =>
          this.props.isButton ? (
            <Button
              disabled={this.props.disabled}
              extraClassNames={`${INLINES.EMBEDDED_ENTRY}-button`}
              size="small"
              onClick={event => this.handleClick(event, widgetAPI)}
              icon="EmbeddedEntryInline"
              buttonType="muted"
              testId={`toolbar-toggle-${INLINES.EMBEDDED_ENTRY}`}>
              Embed inline entry
            </Button>
          ) : (
            <DropdownListItem
              isDisabled={this.props.disabled || !canInsertInline(this.props.change)}
              extraClassNames="rich-text__entry-link-block-button"
              size="small"
              icon="Entry"
              buttonType="muted"
              testId={`toolbar-toggle-${INLINES.EMBEDDED_ENTRY}`}
              onClick={event => this.handleClick(event, widgetAPI)}>
              <div className="cf-flex-grid">
                <Icon
                  icon="EmbeddedEntryInline"
                  color="secondary"
                  extraClassNames="rich-text__embedded-entry-list-icon"
                />
                Inline entry
              </div>
            </DropdownListItem>
          )
        }
      </WidgetAPIContext.Consumer>
    );
  }
}
