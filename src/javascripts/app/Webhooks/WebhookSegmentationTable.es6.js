import React from 'react';
import PropTypes from 'prop-types';
import ActionCheckbox from './WebhookSegmentationActionbox';
import {
  ACTIONS, ENTITY_TYPES, ACTION_LABELS, changeAction, isActionChecked, isActionDisabled
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

  renderActionCheckbox (entityType, action) {
    return (
      <ActionCheckbox key={`${entityType}.${action}`}
                      action={action}
                      type={entityType}
                      isChecked={this.isChecked(entityType, action)}
                      isDisabled={isActionDisabled(entityType, action)}
                      onChange={change => this.onChange(change)} />
    );
  }

  renderRows () {
    return ENTITY_TYPES.map(t => this.renderRow(t));
  }

  renderRow (entityType) {
    return (
      <tr key={entityType}>
        {['*'].concat(ACTIONS).map(action => this.renderActionCheckbox(entityType, action))}
      </tr>
    );
  }

  renderActionLabel (action) {
    return (
      <th key={ACTION_LABELS[action]} onClick={() => this.onChange({ type: '*', action, checked: !this.isChecked('*', action) })}>
        <label>{ACTION_LABELS[action]}</label>
      </th>
    );
  }

  renderFooter () {
    return (
      <tr className="footer">
        <td></td>
        {ACTIONS.map(action => this.renderActionCheckbox('*', action))}
      </tr>
    );
  }

  render () {
    return (
      <table className="webhook-segmentation__matrix">
        <thead>
          <tr>
            <th></th>
            {ACTIONS.map(action => this.renderActionLabel(action))}
          </tr>
        </thead>
        <tbody>
          {this.renderRows()}
          {this.renderFooter()}
        </tbody>
      </table>
    );
  }
}

WebhookSegmentationTable.propTypes = {
  onChange: PropTypes.func,
  values: PropTypes.object
};
