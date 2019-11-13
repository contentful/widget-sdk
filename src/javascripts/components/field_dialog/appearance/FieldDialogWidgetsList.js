// Disabling since this is a custom component
/* eslint-disable rulesdir/restrict-non-f36-components */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FieldDialogWidgetItem from './FieldDialogWidgetItem';
import { NAMESPACE_EXTENSION } from 'widgets/WidgetNamespaces';

export default class FieldDialogWidgetsList extends Component {
  static propTypes = {
    widgets: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    selectedWidgetId: PropTypes.string.isRequired,
    defaultWidgetId: PropTypes.string.isRequired,
    isAdmin: PropTypes.bool.isRequired
  };

  static defaultProps = {
    widgets: []
  };

  render() {
    return (
      <div className="cfnext-form__field">
        <label>Choose how this field should be displayed</label>
        <ul className="field-dialog__widget-list">
          {this.props.widgets.map((widget, index) => {
            const [namespace] = widget.id.split(',');
            return (
              <FieldDialogWidgetItem
                key={widget.id}
                isCustom={namespace === NAMESPACE_EXTENSION}
                isAdmin={this.props.isAdmin}
                isSelected={widget.id === this.props.selectedWidgetId}
                isDefault={this.props.defaultWidgetId === widget.id}
                onClick={() => {
                  this.props.onSelect(widget.id);
                }}
                id={widget.id}
                index={index}
                name={widget.name}
                icon={widget.icon}
                isApp={widget.isApp}
                appIconUrl={widget.appIconUrl}
                appId={widget.appId}
              />
            );
          })}
        </ul>
      </div>
    );
  }
}
