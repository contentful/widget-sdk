import React from 'react';
import PropTypes from 'prop-types';
import ActionCheckbox from './WebhookSegmentationActionbox';
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
}

WebhookSegmentationTable.propTypes = {
  onChange: PropTypes.func,
  values: PropTypes.object
};
