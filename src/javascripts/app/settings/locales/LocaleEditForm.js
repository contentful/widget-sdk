import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { orderBy } from 'lodash';
import { Subheading, Form, Paragraph, Typography } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import Icon from 'ui/Components/Icon';
import { Button, Select, Option, Note, CheckboxField } from '@contentful/forma-36-react-components';
import StateLink from 'app/common/StateLink';
import { create as createLocaleList } from './utils/LocaleList';

const styles = {
  actionButton: css({
    marginLeft: tokens.spacingM
  }),
  note: css({
    marginTop: tokens.spacingM
  })
};

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
    goToList: PropTypes.func.isRequired,
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
        <Workbench.Header
          onBack={() => {
            this.props.goToList();
          }}
          icon={<Icon name="page-settings" scale="0.8" />}
          title={`${this.state.locale.name || 'New locale'}${
            this.state.locale.default ? ' / Default locale' : ''
          }`}
          actions={
            <>
              <StateLink path="^.list">
                {({ onClick }) => (
                  <Button
                    onClick={onClick}
                    buttonType="muted"
                    testId="cancel-locale"
                    className={styles.actionButton}>
                    Cancel
                  </Button>
                )}
              </StateLink>
              {this.props.onDelete && (
                <Button
                  testId="delete-locale"
                  buttonType="negative"
                  loading={this.props.isDeleting}
                  onClick={this.delete}
                  className={styles.actionButton}>
                  Delete
                </Button>
              )}
              <Button
                testId="save-locale"
                disabled={this.isSaveDisabled()}
                loading={this.props.isSaving}
                buttonType="positive"
                onClick={this.save}
                className={styles.actionButton}>
                Save
              </Button>
            </>
          }
        />
        <Workbench.Content>
          <Form>
            <Subheading element="h2">Locale</Subheading>

            <Select
              width="large"
              testId="locale-code-select"
              value={this.state.locale.code || ''}
              onChange={e => this.updateLocaleCode(e.target.value)}>
              <Option value="">Select a locale</Option>
              {orderBy(this.state.locales, ['name'], ['asc']).map(locale => (
                <Option key={locale.code} value={locale.code}>
                  {locale.label}
                </Option>
              ))}
            </Select>
            {!this.state.locale.default && (
              <Typography>
                <Subheading>Fallback locale</Subheading>
                <Paragraph>
                  If no content is provided for the locale above, the Delivery API will return
                  content in a locale specified below:
                </Paragraph>
                <Select
                  testId="locale-fallback-code-select"
                  value={this.state.locale.fallbackCode || ''}
                  onChange={e => this.updateLocaleState('fallbackCode', e.target.value || null)}>
                  <Option value="">None (no fallback)</Option>
                  {this.state.fallbackLocales.map(locale => (
                    <Option key={locale.code} value={locale.code}>
                      {locale.label}
                    </Option>
                  ))}
                </Select>
                <Note noteType="primary" className={styles.note}>
                  If you have required fields in your content model,{' '}
                  <strong>enable empty required fields</strong> (there’s a checkbox below). You need
                  to do that because required fields can’t be published when content in a certain
                  locale is not provided.
                </Note>
              </Typography>
            )}

            <Subheading element="h2">Locale settings</Subheading>

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
            <CheckboxField
              id="contentManagementApi"
              name="contentManagementApi"
              disabled={this.state.locale.default}
              checked={this.state.locale.contentManagementApi}
              onChange={e => this.updateLocaleState('contentManagementApi', e.target.checked)}
              labelText="Enable editing for this locale"
              helpText="Displays locale to editors and enables it in Management API."
            />
            <CheckboxField
              id="optional"
              name="optional"
              disabled={this.state.locale.default}
              checked={this.state.locale.optional}
              onChange={e => this.updateLocaleState('optional', e.target.checked)}
              labelText="Allow empty fields for this locale"
              helpText="Entries with required fields can still be published if locale is empty."
            />
          </Form>
        </Workbench.Content>
      </Workbench>
    );
  }
}
