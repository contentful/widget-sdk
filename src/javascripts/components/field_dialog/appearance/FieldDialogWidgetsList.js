// Disabling since this is a custom component
/* eslint-disable rulesdir/restrict-non-f36-components */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FieldDialogWidgetItem from './FieldDialogWidgetItem';

export default class FieldDialogWidgetsList extends Component {
  static propTypes = {
    widgets: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    selectedWidget: PropTypes.shape({
      namespace: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired
    }).isRequired,
    defaultWidget: PropTypes.shape({
      namespace: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired
    }).isRequired,
    isAdmin: PropTypes.bool.isRequired
  };

  static defaultProps = {
    widgets: []
  };

  render() {
    const { widgets, selectedWidget, defaultWidget } = this.props;

    return (
      <div className="cfnext-form__field">
        <label>Choose how this field should be displayed</label>
        <ul className="field-dialog__widget-list">
          {widgets.map((widget, index) => {
            const isSameWidget = w => widget.namespace === w.namespace && widget.id === w.id;

            return (
              <FieldDialogWidgetItem
                key={[widget.namespace, widget.id].join(',')}
                index={index}
                widget={widget}
                isAdmin={this.props.isAdmin}
                isSelected={isSameWidget(selectedWidget)}
                isDefault={isSameWidget(defaultWidget)}
                onClick={() => {
                  this.props.onSelect(widget);
                }}
              />
            );
          })}
        </ul>
      </div>
    );
  }
}
