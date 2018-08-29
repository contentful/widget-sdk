import React from 'react';
import PropTypes from 'prop-types';

import {
  ACTIONS,
  ENTITY_TYPES,
  ACTION_LABELS,
  TYPE_LABELS,
  isActionChecked,
  isActionDisabled,
  changeAction
} from './WebhookSegmentationState';

export default class WebhookSegmentationTable extends React.Component {
  static propTypes = {
    values: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
  };

  renderCheckbox(entityType, action) {
    const key = `${entityType}.${action}`;

    if (isActionDisabled(entityType, action)) {
      return (
        <td key={key} className="x--disabled-cell">
          <input type="checkbox" disabled />
        </td>
      );
    }

    const { values, onChange } = this.props;

    return (
      <td key={key} className={entityType === '*' ? 'x--highlighted-cell' : ''}>
        <label>
          <input
            type="checkbox"
            checked={isActionChecked(values, entityType, action)}
            onChange={e => onChange(changeAction(values, entityType, action, e.target.checked))}
          />
          {action === '*' ? ` ${TYPE_LABELS[entityType]}` : ''}
        </label>
      </td>
    );
  }

  renderRow(entityType) {
    return (
      <tr key={entityType}>
        {['*'].concat(ACTIONS).map(action => this.renderCheckbox(entityType, action))}
      </tr>
    );
  }

  render() {
    return (
      <table className="webhook-editor__segmentation-table">
        <thead>
          <tr>
            <th className="x--empty-cell" />
            {ACTIONS.map(a => ACTION_LABELS[a]).map(a => (
              <th key={a}>{a}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ENTITY_TYPES.map(entityType => this.renderRow(entityType))}
          <tr>
            <td className="x--empty-cell" />
            {ACTIONS.map(action => this.renderCheckbox('*', action))}
          </tr>
        </tbody>
      </table>
    );
  }
}
