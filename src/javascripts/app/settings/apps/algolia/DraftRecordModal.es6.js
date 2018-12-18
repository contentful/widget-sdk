import React from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  Button,
  Form,
  TextField,
  SelectField,
  FormLabel,
  Option,
  HelpText,
  Notification
} from '@contentful/forma-36-react-components';

import FieldEditor from './FieldEditor.es6';
import Switch from './Switch.es6';
import { RecordType } from './types.es6';

export const SELECT_LOCALE = '___select_locale___';

export default class DraftRecordModal extends React.Component {
  static propTypes = {
    isShown: PropTypes.bool.isRequired,
    installed: PropTypes.bool.isRequired,
    contentType: PropTypes.shape({
      name: PropTypes.string.isRequired,
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired
      }).isRequired
    }).isRequired,
    draftRecord: RecordType,
    locales: PropTypes.arrayOf(PropTypes.object).isRequired,
    onCredentialsChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onIndexChange: PropTypes.func.isRequired,
    onLocaleChange: PropTypes.func.isRequired,
    onFieldsChange: PropTypes.func.isRequired
  };

  isNewRecord() {
    return this.props.draftRecord.isNewRecord;
  }

  onCreate = () => {
    if (!this.props.draftRecord.localeCode || this.props.draftRecord.localeCode === SELECT_LOCALE) {
      return Notification.error('Please select a language');
    }

    if (!this.props.draftRecord.index || !this.props.draftRecord.index.trim()) {
      return Notification.error('A valid Algolia index is required');
    }

    if (
      !this.props.draftRecord.fields.default &&
      (!this.props.draftRecord.fields.custom || this.props.draftRecord.fields.custom.length === 0)
    ) {
      return Notification.error('At least one field needs to be selected');
    }

    this.props.onClose();
    this.props.onSave();
  };

  onCancel = () => {
    this.props.onClose();
    this.props.onCancel();
  };

  toggleFieldSelection = () => {
    this.props.onFieldsChange({ default: !this.props.draftRecord.fields.default });
  };

  render() {
    return (
      <Modal
        size="800px"
        isShown={this.props.isShown}
        onClose={this.props.onClose}
        shouldCloseOnEscapePress={false}
        shouldCloseOnOverlayClick={false}>
        {() => (
          <React.Fragment>
            <Modal.Header
              title={`Configure "${this.props.contentType.name}" Index`}
              onClose={this.props.onClose}
            />
            {this.renderForm()}
            {this.renderButtonSet()}
          </React.Fragment>
        )}
      </Modal>
    );
  }

  renderButtonSet() {
    return (
      <footer className="algolia-app__config-modal-buttons">
        {!this.isNewRecord() ? (
          <div className="algolia-app__config-modal-buttons-left">
            <Button
              buttonType="negative"
              onClick={() => this.props.onDelete(this.props.draftRecord.configIndex)}>
              Delete
            </Button>
          </div>
        ) : null}
        <div className="algolia-app__config-modal-buttons-right">
          <Button buttonType="primary" onClick={this.onCreate}>
            {this.isNewRecord() ? 'Create' : 'Save'}
          </Button>
          <Button buttonType="muted" onClick={this.onCancel}>
            Cancel
          </Button>
        </div>
        <div className="clear" />
      </footer>
    );
  }

  renderForm() {
    return (
      <Form extraClassNames="algolia-app__config-modal-form" spacing="condensed">
        <SelectField
          id="algolia-language"
          name="algolia-language"
          value={this.props.draftRecord.localeCode}
          labelText="Language"
          onChange={e => this.props.onLocaleChange(e.target.value)}
          helpText="Select the language that you want to index.">
          <Option key={SELECT_LOCALE} value={SELECT_LOCALE}>
            Select locale
          </Option>
          {this.props.locales.map(l => (
            <Option key={l.code} value={l.code}>
              {l.name} ({l.code})
            </Option>
          ))}
        </SelectField>
        <TextField
          id="algolia-index-name"
          name="algolia-index-name"
          labelText="Algolia Index Name"
          value={this.props.draftRecord.index}
          onChange={e => this.props.onIndexChange(e.target.value)}
          helpText="It can be found under indices menu in Algolia."
        />
        {this.renderFieldPrompt()}
      </Form>
    );
  }

  renderFieldPrompt() {
    return (
      <div className="algolia-app__config-fields">
        <FormLabel>Searchable Fields</FormLabel>
        <Switch on={!this.props.draftRecord.fields.default} onToggle={this.toggleFieldSelection}>
          <HelpText>By default, we index all fields. You can customize it optionally.</HelpText>
        </Switch>
        {!this.props.draftRecord.fields.default ? (
          <FieldEditor
            contentType={this.props.contentType}
            draftRecord={this.props.draftRecord}
            onDraftFieldsChange={this.props.onFieldsChange}
          />
        ) : null}
      </div>
    );
  }
}
