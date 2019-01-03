import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AdminOnly from 'app/common/AdminOnly.es6';
import LocaleEditForm from '../LocaleEditForm.es6';
import createFetcherComponent, { FetcherLoading } from 'app/common/createFetcherComponent.es6';
import StateRedirect from 'app/common/StateRedirect.es6';
import LocaleNotifications from '../utils/LocaleNotifications.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
const TheLocaleStore = getModule('TheLocaleStore');

const LocalesFetcher = createFetcherComponent(() => {
  return spaceContext.localeRepo.getAll();
});

class NewLocaleForm extends Component {
  static propTypes = {
    spaceLocales: PropTypes.arrayOf(PropTypes.object).isRequired,
    saveLocale: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    registerSaveAction: PropTypes.func.isRequired
  };

  state = {
    isSaving: false,
    savedLocale: null
  };

  onSaveLocale = data => {
    this.setState({ isSaving: true });
    return this.props
      .saveLocale({
        code: data.code || null,
        name: data.name || null,
        fallbackCode: data.fallbackCode || null,
        contentDeliveryApi: data.contentDeliveryApi || false,
        contentManagementApi: data.contentManagementApi || false,
        optional: data.optional || false
      })
      .then(locale => {
        this.props.setDirty(false);
        this.setState({ savedLocale: locale, isSaving: false }, () => {
          LocaleNotifications.saveSuccess();
        });
      })
      .catch(err => {
        this.props.setDirty(true);
        this.setState({ isSaving: false }, () => {
          LocaleNotifications.saveError(err);
        });
      });
  };

  render() {
    if (this.state.savedLocale) {
      return (
        <StateRedirect
          to="^.detail"
          params={{
            localeId: this.state.savedLocale.sys.id
          }}
        />
      );
    }
    return (
      <LocaleEditForm
        initialLocale={{
          code: null,
          name: null,
          fallbackCode: null,
          default: false,
          contentDeliveryApi: true,
          contentManagementApi: true,
          optional: false
        }}
        spaceLocales={this.props.spaceLocales}
        isSaving={this.state.isSaving}
        onSave={this.onSaveLocale}
        setDirty={this.props.setDirty}
        registerSaveAction={this.props.registerSaveAction}
      />
    );
  }
}

export default class LocalesNewRoute extends React.Component {
  save = async function(locale) {
    const savedLocale = await spaceContext.localeRepo.save(locale);
    await TheLocaleStore.refresh();
    return savedLocale;
  };

  render() {
    return (
      <AdminOnly>
        <LocalesFetcher>
          {({ isLoading, isError, data }) => {
            if (isLoading) {
              return <FetcherLoading message="Loading locale..." />;
            }
            if (isError) {
              return <StateRedirect to="^.list" />;
            }
            const spaceLocales = data;
            return (
              <NewLocaleForm
                spaceLocales={spaceLocales}
                saveLocale={this.save}
                setDirty={this.props.setDirty}
                registerSaveAction={this.props.registerSaveAction}
              />
            );
          }}
        </LocalesFetcher>
      </AdminOnly>
    );
  }
}

LocalesNewRoute.propTypes = {
  setDirty: PropTypes.func.isRequired,
  registerSaveAction: PropTypes.func.isRequired
};
