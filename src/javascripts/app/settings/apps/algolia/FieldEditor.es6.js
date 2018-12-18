import React from 'react';
import PropTypes from 'prop-types';
import {
  Select,
  Option,
  TextInput,
  Button,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TextLink,
  Notification,
  SectionHeading
} from '@contentful/forma-36-react-components';

import { UNINDEXABLE_FIELD_TYPES } from './Webhooks.es6';
import { helpers, getHelperByKey } from './webhook-helpers.es6';
import { FieldType, RecordType } from './types.es6';

const SELECT_FIELD = '___select__field___';
const SELECT_HELPER = '___select__helper___';

export class FieldEditorRow extends React.Component {
  static propTypes = {
    availableFields: PropTypes.arrayOf(PropTypes.object).isRequired,
    onAdd: PropTypes.func.isRequired
  };

  static getEmptyState() {
    return {
      id: SELECT_FIELD,
      helper: SELECT_HELPER,
      helperParameter: ''
    };
  }

  state = FieldEditorRow.getEmptyState();

  getField = () => {
    return this.props.availableFields.find(
      field => field.id === this.state.id || field.apiName === this.state.id
    );
  };

  getHelper = () => {
    return getHelperByKey(this.state.helper);
  };

  onAdd = () => {
    const field = this.getField();
    const helper = this.getHelper();
    const helperParameter = this.state.helperParameter;

    if (!field) {
      Notification.error('Please, select a field');
      return;
    }
    if (helper && helper.param && !helperParameter) {
      Notification.error('Please, provide correct value for the helper');
      return;
    }

    this.props.onAdd({
      field,
      helper,
      helperParameter: helper && helper.param ? helperParameter : ''
    });

    this.setState(FieldEditorRow.getEmptyState());
  };

  render() {
    const selectedHelper = this.getHelper();
    return (
      <React.Fragment>
        <div className="algolia-app__config-field-editor-row">
          <Select
            extraClassNames="algolia-app__config-field-editor-row__field-select"
            value={this.state.id}
            onChange={e => {
              this.setState({ id: e.target.value });
            }}>
            <Option value={SELECT_FIELD}>Fields</Option>
            {this.props.availableFields.map(f => (
              <Option key={f.apiName || f.id} value={f.apiName || f.id}>
                {f.name}
              </Option>
            ))}
          </Select>
          <Select
            extraClassNames="algolia-app__config-field-editor-row__helper-select"
            value={this.state.helper}
            onChange={e => {
              this.setState({ helper: e.target.value });
            }}>
            <Option value={SELECT_HELPER}>Full value</Option>
            {helpers.map(h => (
              <Option key={h.key} value={h.key}>
                {h.title}
              </Option>
            ))}
          </Select>
          {selectedHelper && selectedHelper.param && (
            <TextInput
              extraClassNames="algolia-app__config-field-editor-row__helper-value-input"
              placeholder={selectedHelper.placeholder}
              value={this.state.helperParameter}
              onChange={e => {
                this.setState({ helperParameter: e.target.value });
              }}
            />
          )}
          <Button
            extraClassNames="algolia-app__config-field-editor-row__add-button"
            buttonType="muted"
            onClick={this.onAdd}>
            Add
          </Button>
        </div>
      </React.Fragment>
    );
  }
}

class FieldEditorTable extends React.Component {
  static propTypes = {
    fields: PropTypes.arrayOf(FieldType).isRequired,
    onRemove: PropTypes.func.isRequired,
    contentType: PropTypes.object.isRequired
  };

  getHelperTitle = helperKey => {
    const helper = helpers.find(helper => helper.key === helperKey);
    return helper ? helper.title : helperKey;
  };

  getField = id => {
    const field = this.props.contentType.fields.find(
      field => field.apiName === id || field.id === id
    );
    return field ? field.name : id;
  };

  render() {
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <SectionHeading>Selected Fields</SectionHeading>
            </TableCell>
            <TableCell>
              <SectionHeading>Helper</SectionHeading>
            </TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {this.props.fields.map(item => (
            <TableRow key={item.id}>
              <TableCell>{this.getField(item.id)}</TableCell>
              <TableCell>
                {item.helper ? (
                  <div>
                    {this.getHelperTitle(item.helper)}{' '}
                    {item.helperParameter ? `(${item.helperParameter})` : null}
                  </div>
                ) : (
                  <div>Full value</div>
                )}
              </TableCell>

              <TableCell align="right">
                <TextLink onClick={() => this.props.onRemove(item.id)}>Remove</TextLink>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
}

export default class FieldEditor extends React.Component {
  static propTypes = {
    contentType: PropTypes.shape({
      name: PropTypes.string.isRequired,
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired
      }).isRequired,
      fields: PropTypes.arrayOf(PropTypes.object).isRequired
    }).isRequired,
    draftRecord: RecordType.isRequired,
    onDraftFieldsChange: PropTypes.func.isRequired
  };

  onAdd = item => {
    const fields = this.getSelectedFields();
    this.props.onDraftFieldsChange({
      custom: [
        {
          id: item.field.apiName || item.field.id,
          helper: item.helper ? item.helper.key : undefined,
          helperParameter: item.helperParameter || undefined
        },
        ...fields
      ]
    });
  };

  onRemove = id => {
    const fields = this.getSelectedFields();
    this.props.onDraftFieldsChange({
      custom: fields.filter(item => item.id !== id)
    });
  };

  getSelectedFields = () => {
    return this.props.draftRecord.fields.custom || [];
  };

  getAvailableFields = () => {
    const selectedIds = this.getSelectedFields().map(item => item.apiName || item.id);
    return this.props.contentType.fields.filter(
      field =>
        !selectedIds.includes(field.apiName || field.id) &&
        !UNINDEXABLE_FIELD_TYPES.includes(field.type)
    );
  };

  canAddMore = () => {
    return this.getSelectedFields().length < this.props.contentType.fields.length;
  };

  render() {
    const selectedFields = this.getSelectedFields();
    return (
      <div className="algolia-app__config-field-editor">
        {this.canAddMore() && (
          <FieldEditorRow availableFields={this.getAvailableFields()} onAdd={this.onAdd} />
        )}
        {selectedFields.length > 0 && (
          <FieldEditorTable
            contentType={this.props.contentType}
            fields={selectedFields}
            onRemove={this.onRemove}
          />
        )}
      </div>
    );
  }
}
