import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Paragraph,
  Checkbox,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormLabel,
} from '@contentful/forma-36-react-components';
import {
  ACTIONS,
  ENTITY_TYPES,
  ACTION_LABELS,
  TYPE_LABELS,
  isActionChecked,
  isActionDisabled,
  changeAction,
  shouldHideEntity,
  shouldHideAction,
} from './WebhookSegmentationState';

export class WebhookSegmentationTable extends React.Component {
  static propTypes = {
    values: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
  };

  renderCheckbox(entityType, action) {
    const key = `${entityType}.${action}`;

    if (isActionDisabled(entityType, action)) {
      if (shouldHideAction(action)) return;

      return (
        <TableCell key={key} className="x--disabled-cell">
          <Checkbox labelText="disabled-cell" disabled />
        </TableCell>
      );
    }

    const { values, onChange } = this.props;

    return (
      <TableCell
        testId="checkbox-row"
        key={key}
        className={entityType === '*' ? 'x--highlighted-cell' : ''}>
        <FormLabel>
          <Checkbox
            labelText={action === '*' ? ` ${TYPE_LABELS[entityType]}` : ''}
            checked={isActionChecked(values, entityType, action)}
            onChange={(e) => onChange(changeAction(values, entityType, action, e.target.checked))}
          />
          {action === '*' ? ` ${TYPE_LABELS[entityType]}` : ''}
        </FormLabel>
      </TableCell>
    );
  }

  renderRow(entityType) {
    return (
      <TableRow key={entityType}>
        {['*'].concat(ACTIONS).map((action) => this.renderCheckbox(entityType, action))}
      </TableRow>
    );
  }

  render() {
    return (
      <Fragment>
        <br />
        <Paragraph>Content Events</Paragraph>
        <Table className="webhook-editor__segmentation-table">
          <TableHead>
            <TableRow>
              <th className="x--empty-cell" />
              {ACTIONS.map((a) => ACTION_LABELS[a]).map(
                (a) => !shouldHideAction(a) && <th key={a}>{a}</th>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {ENTITY_TYPES.map(
              (entityType) => !shouldHideEntity(entityType) && this.renderRow(entityType)
            )}
            <TableRow>
              <TableCell className="x--empty-cell" />
              {ACTIONS.map(
                (action) => !shouldHideAction(action) && this.renderCheckbox('*', action)
              )}
            </TableRow>
          </TableBody>
        </Table>
      </Fragment>
    );
  }
}
