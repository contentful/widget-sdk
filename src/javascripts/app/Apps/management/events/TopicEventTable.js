import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from '@contentful/forma-36-react-components';
import {
  ACTIONS,
  ENTITY_TYPES,
  ACTION_LABELS,
  TYPE_LABELS,
  isActionDisabled,
  isActionChecked,
  changeAction,
} from './TopicEventMap';

export function TopicEventTable({ values, onChange, id }) {
  const renderCheckbox = (entityType, action) => {
    const key = `${entityType}.${action}`;

    if (isActionDisabled(entityType, action)) {
      return (
        <td key={key} className="x--disabled-cell">
          <Checkbox labelText="disabled-cell" disabled />
        </td>
      );
    }
    return (
      <td
        data-test-id="checkbox-row"
        key={key}
        className={entityType === '*' ? 'x--highlighted-cell' : ''}>
        <label>
          <Checkbox
            labelText={action === '*' ? ` ${TYPE_LABELS[entityType]}` : ''}
            checked={isActionChecked(values, entityType, action)}
            onChange={(e) => onChange(changeAction(values, entityType, action, e.target.checked))}
          />
          {action === '*' ? ` ${TYPE_LABELS[entityType]}` : ''}
        </label>
      </td>
    );
  };

  const renderRow = (entityType) => {
    return (
      <tr key={entityType}>
        {['*'].concat(ACTIONS).map((action) => renderCheckbox(entityType, action))}
      </tr>
    );
  };

  return (
    <table className="webhook-editor__segmentation-table" id={id}>
      <thead>
        <tr>
          <th className="x--empty-cell" />
          {ACTIONS.map((a) => ACTION_LABELS[a]).map((a) => (
            <th key={a}>{a}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ENTITY_TYPES.map((entityType) => renderRow(entityType))}
        <tr>
          <td className="x--empty-cell" />
          {ACTIONS.map((action) => renderCheckbox('*', action))}
        </tr>
      </tbody>
    </table>
  );
}

TopicEventTable.propTypes = {
  values: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
