import React, { Component } from 'react';
import PropTypes from 'prop-types';
import FieldDialogWidgetItem from './FieldDialogWidgetItem.es6';

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
          {this.props.widgets.map((widget, index) => (
            <FieldDialogWidgetItem
              key={widget.id}
              isCustom={widget.custom === true}
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
            />
          ))}
        </ul>
      </div>
    );
  }
}
