import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Workbench from 'app/common/Workbench.es6';
import { Button, Select, Option, Note, CheckboxField } from '@contentful/ui-component-library';
import Icon from 'ui/Components/Icon.es6';
import StateLink from 'app/common/StateLink.es6';
import { create as createLocaleList } from './utils/LocaleList.es6';

const FORM_SPACING = { marginBottom: 20 };

export default class LocaleEditForm extends Component {
  static propTypes = {
    initialLocale: PropTypes.shape({
      // not-created locales don't have sys
      sys: PropTypes.object,
      code: PropTypes.string,
      name: PropTypes.string,
      fallbackCode: PropTypes.string,
      default: PropTypes.bool,
      optional: PropTypes.bool.isRequired,
      contentDeliveryApi: PropTypes.bool.isRequired,
      contentManagementApi: PropTypes.bool.isRequired
    }).isRequired,
    spaceLocales: PropTypes.arrayOf(PropTypes.object).isRequired,
    setDirty: PropTypes.func.isRequired,
    onDelete: PropTypes.func,
    isDeleting: PropTypes.bool,
    onSave: PropTypes.func.isRequired,
    isSaving: PropTypes.bool.isRequired,
    registerSaveAction: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.localeList = createLocaleList(props.spaceLocales);
    this.state = {
      locale: props.initialLocale,
      dirty: false,
      locales: this.localeList.prepareLocaleList(props.initialLocale),
      fallbackLocales: this.localeList.prepareFallbackList(props.initialLocale.code || ''),
      hasDependantLocales: this.localeList.hasDependantLocales(props.initialLocale.code || '')
    };
  }

  getLocaleName(locales, code) {
    const locale = locales.find(locale => locale.code === code);
    return locale ? locale.name : '';
  }

  delete = () => {
    if (this.props.onDelete) {
      this.props.onDelete(this.props.initialLocale, this.localeList);
    }
  };

  save = () => {
    this.props.onSave(this.state.locale, this.props.initialLocale, this.localeList);
  };

  componentDidMount() {
    this.props.registerSaveAction(this.save);
    this.props.setDirty(this.state.dirty);
  }

  updateLocaleCode = value => {
    this.setState(
      state => ({
        ...state,
        locale: {
          ...state.locale,
          code: value,
          name: this.getLocaleName(state.locales, value)
        },
        fallbackLocales: this.localeList.prepareFallbackList(value),
        dirty: true
      }),
      () => {
        this.props.setDirty(true);
      }
    );
  };

  updateLocaleState = (field, value) => {
    this.setState(
      state => ({
        ...state,
        locale: {
          ...state.locale,
          [field]: value
        },
        dirty: true
      }),
      () => {
        this.props.setDirty(true);
      }
    );
  };

  isSaveDisabled = () => {
    return this.state.dirty === false || this.state.locale.code === '';
  };

  render() {
    return (
      <Workbench>
        <Workbench.Header>
          <StateLink to="^.list">
            {({ onClick }) => (
              <div className="breadcrumbs-widget">
                <div className="breadcrumbs-container">
                  <div className="btn btn__back" onClick={onClick}>
                    <Icon name="back" />
                  </div>
                </div>
              </div>
            )}
          </StateLink>
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>{this.state.locale.name || 'New locale'}</Workbench.Title>
          {this.state.locale.default && (
            <Workbench.Header.Description>Default locale</Workbench.Header.Description>
          )}
          <Workbench.Header.Actions>
            <StateLink to="^.list">
              {({ onClick }) => (
                <Button onClick={onClick} buttonType="muted" testId="cancel-locale">
                  Cancel
                </Button>
              )}
            </StateLink>
            {this.props.onDelete && (
              <Button
                testId="delete-locale"
                buttonType="negative"
                loading={this.props.isDeleting}
                onClick={this.delete}>
                Delete
              </Button>
            )}
            <Button
              testId="save-locale"
              disabled={this.isSaveDisabled()}
              loading={this.props.isSaving}
              buttonType="positive"
              onClick={this.save}>
              Save
            </Button>
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content noSidebar style={{ marginTop: 20 }}>
          <div className="locale-editor">
            <h1 className="locale-editor__group-title">Locale</h1>
            <div className="locale-editor__group">
              <div className="locale-editor__setting">
                <Select
                  testId="locale-code-select"
                  value={this.state.locale.code || ''}
                  onChange={e => this.updateLocaleCode(e.target.value)}>
                  <Option value="">Select a locale</Option>
                  {this.state.locales.map(locale => (
                    <Option key={locale.code} value={locale.code}>
                      {locale.label}
                    </Option>
                  ))}
                </Select>
              </div>
              {!this.state.locale.default && (
                <React.Fragment>
                  <div className="locale-editor__setting">
                    <h2>Fallback locale</h2>
                    <p>
                      If no content is provided for the locale above, the Delivery API will return
                      content in a locale specified below:
                    </p>
                    <Select
                      testId="locale-fallback-code-select"
                      value={this.state.locale.fallbackCode || ''}
                      onChange={e => this.updateLocaleState('fallbackCode', e.target.value)}>
                      <Option value="">None (no fallback)</Option>
                      {this.state.fallbackLocales.map(locale => (
                        <Option key={locale.code} value={locale.code}>
                          {locale.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div style={FORM_SPACING} />
                  <Note noteType="primary">
                    If you have required fields in your content model,{' '}
                    <strong>enable empty required fields</strong> (there’s a checkbox below). You
                    need to do that because required fields can’t be published when content in a
                    certain locale is not provided.
                  </Note>
                </React.Fragment>
              )}
            </div>
            <h1 className="locale-editor__group-title">Locale settings</h1>
            <div className="locale-editor__group">
              <div style={FORM_SPACING}>
                <CheckboxField
                  id="contentDeliveryApi"
                  name="contentDeliveryApi"
                  disabled={this.state.locale.default || this.state.hasDependantLocales}
                  checked={this.state.locale.contentDeliveryApi}
                  onChange={e => this.updateLocaleState('contentDeliveryApi', e.target.checked)}
                  labelText="Enable this locale in response"
                  helpText={`Includes locale in the Delivery API response. ${
                    this.state.hasDependantLocales
                      ? "You can't change this because this locale is being used as a fallback."
                      : ''
                  }`}
                />
              </div>
              <div style={FORM_SPACING}>
                <CheckboxField
                  id="contentManagementApi"
                  name="contentManagementApi"
                  disabled={this.state.locale.default}
                  checked={this.state.locale.contentManagementApi}
                  onChange={e => this.updateLocaleState('contentManagementApi', e.target.checked)}
                  labelText="Enable editing for this locale"
                  helpText="Displays locale to editors and enables it in Management API."
                />
              </div>
              <div style={FORM_SPACING}>
                <CheckboxField
                  id="optional"
                  name="optional"
                  disabled={this.state.locale.default}
                  checked={this.state.locale.optional}
                  onChange={e => this.updateLocaleState('optional', e.target.checked)}
                  labelText="Allow empty fields for this locale"
                  helpText="Entries with required fields can still be published if locale is empty."
                />
              </div>
            </div>
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}
