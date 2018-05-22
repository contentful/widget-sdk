import React from 'react';
import PropTypes from 'prop-types';
import {
  ACTIONS, ENTITY_TYPES, LABELS, changeAction, isActionChecked, isActionDisabled
} from './WebhookSegmentationState';

export default class WebhookSegmentationTable extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      values: this.props.values
    };
  }


  isChecked (type, action) {
    return isActionChecked(this.state.values, type, action);
  }

  // This method is passed to child elements. They provide a change object, e.g
  // {
  //   action: "save",
  //   type: "contentType",
  //   checked: true
  // }
  onChange (change) {
    // Get a copy of the values object
    const map = changeAction(this.state.values, change.type, change.action, change.checked);

    this.setState({
      values: map
    });

    this.props.onChange(map);
  }

  render () {
    return (
      <table className="webhook-segmentation__matrix">
        <thead>
          <th></th>
          {ACTIONS.map(action => this.renderActionLabel(action))}
        </thead>
        <tbody>
          {this.renderRows()}
          {this.renderFooter()}
        </tbody>
      </table>
    );
  }

  renderRows () {
    return ENTITY_TYPES.map(t => this.renderRow(t));
  }

  renderRow (entityType) {
    return (
      <tr>
        {['*'].concat(ACTIONS).map(action => (<ActionCheckbox key={`checkbox-${entityType}.${action}`}
                                                              action={action}
                                                              type={entityType}
                                                              isChecked={this.isChecked(entityType, action)}
                                                              isDisabled={isActionDisabled(entityType, action)}
                                                              onChange={change => this.onChange(change)} />))}
      </tr>
    );
  }

  renderActionLabel (action) {
    return (
      <th onClick={() => this.onChange({ type: '*', action, checked: !this.isChecked('*', action) })}>
        <label>{LABELS[action]}</label>
      </th>
    );
  }

  renderFooter () {
    return (
      <tr className="footer">
        <td></td>
        {ACTIONS.map(action => <ActionCheckbox key={`footer.*.${action}`}
                                               type="*"
                                               action={action}
                                               isChecked={this.isChecked('*', action)}
                                               onChange={change => this.onChange(change)} />)}
      </tr>
    );
  }
}

WebhookSegmentationTable.propTypes = {
  onChange: PropTypes.func,
  values: PropTypes.object
};

class ActionCheckbox extends React.Component {
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

  renderLabel () {
    if (this.props.action === '*') {
      return (
          <label>{LABELS[this.props.type]}</label>
      );
    }
  }
}

ActionCheckbox.propTypes = {
  action: PropTypes.string,
  isChecked: PropTypes.bool,
  isDisabled: PropTypes.bool,
  onChange: PropTypes.func,
  type: PropTypes.string
};
