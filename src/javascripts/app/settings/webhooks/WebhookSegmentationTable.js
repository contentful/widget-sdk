import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Paragraph } from '@contentful/forma-36-react-components';
import {
  ACTIONS,
  ENTITY_TYPES,
  ACTION_LABELS,
  TYPE_LABELS,
  isActionChecked,
  isActionDisabled,
  changeAction,
  shouldHideEntity,
  shouldHideAction
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

    if (shouldHideAction(action)) return;

    const { values, onChange } = this.props;

    return (
      <td
        data-test-id="checkbox-row"
        key={key}
        className={entityType === '*' ? 'x--highlighted-cell' : ''}>
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
      <Fragment>
        <br />
        <Paragraph>Content Events</Paragraph>
        <table className="webhook-editor__segmentation-table">
          <thead>
            <tr>
              <th className="x--empty-cell" />
              {ACTIONS.map(a => ACTION_LABELS[a]).map(
                a => !shouldHideAction(a) && <th key={a}>{a}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {ENTITY_TYPES.map(
              entityType => !shouldHideEntity(entityType) && this.renderRow(entityType)
            )}
            <tr>
              <td className="x--empty-cell" />
              {ACTIONS.map(action => this.renderCheckbox('*', action))}
            </tr>
          </tbody>
        </table>
      </Fragment>
    );
  }
}
