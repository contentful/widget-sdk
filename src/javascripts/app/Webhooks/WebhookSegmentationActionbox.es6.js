import React from 'react';
import PropTypes from 'prop-types';
import { LABELS } from './WebhookSegmentationState';

export default class ActionCheckbox extends React.Component {
  onChange (event) {
    this.props.onChange({
      type: this.props.type,
      action: this.props.action,
      checked: event.target.checked
    });
  }

  toggle () {
    this.props.onChange({
      checked: !this.props.isChecked,
      type: this.props.type,
      action: this.props.action
    });
  }

  renderLabel () {
    if (this.props.action === '*') {
      return (
          <label>{LABELS[this.props.type]}</label>
      );
    }
  }

  render () {
    if (this.props.isDisabled) {
      return (<td className="action-cell"><input type="checkbox" disabled /></td>);
    }

    return (
      <td onClick={() => this.toggle()} className={this.props.action === '*' ? 'entity-label' : 'action-cell'}>
        <input id={this.props.type} type="checkbox" checked={this.props.isChecked} onChange={e => this.onChange(e)} />
        {this.renderLabel()}
      </td>
    );
  }
}

ActionCheckbox.propTypes = {
  action: PropTypes.string,
  isChecked: PropTypes.bool,
  isDisabled: PropTypes.bool,
  onChange: PropTypes.func,
  type: PropTypes.string
};
