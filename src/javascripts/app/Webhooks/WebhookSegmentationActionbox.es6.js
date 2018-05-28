import React from 'react';
import PropTypes from 'prop-types';
import { TYPE_LABELS } from './WebhookSegmentationState';

export default class ActionCheckbox extends React.Component {
  onChange (checked) {
    this.props.onChange({
      type: this.props.type,
      action: this.props.action,
      checked
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
        <label>{TYPE_LABELS[this.props.type]}</label>
      );
    }
  }

  render () {
    if (this.props.isDisabled) {
      return (
        <td className="action-cell">
          <input type="checkbox" disabled />
        </td>
      );
    }

    const classes = [];
    if (this.props.action === '*') {
      classes.push('entity-label', 'x--clickable-cell');
    } else {
      classes.push('action-cell');
    }

    if (this.props.type === '*') {
      classes.push('x--highlighted-cell');
    }

    return (
      <td onClick={() => this.toggle()} className={classes.join(' ')}>
        <input id={this.props.type}
               type="checkbox"
               checked={this.props.isChecked}
               onChange={e => this.onChange(e.target.checked)} />
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
