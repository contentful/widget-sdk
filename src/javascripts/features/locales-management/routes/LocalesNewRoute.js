import React, { Component, useMemo } from 'react';
import PropTypes from 'prop-types';
import createFetcherComponent from 'app/common/createFetcherComponent';
import { LocalesFormSkeleton } from '../skeletons/LocalesFormSkeleton';
import * as LocaleNotifications from '../utils/LocaleNotifications';
import { LocaleEditForm } from '../LocaleEditForm';
import { getSectionVisibility } from 'access_control/AccessChecker';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import DocumentTitle from 'components/shared/DocumentTitle';
import TheLocaleStore from 'services/localeStore';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import createLocaleRepo from 'data/CMA/LocaleRepo';
import { RouteNavigate } from 'core/react-routing';

const LocalesFetcher = createFetcherComponent(({ localeRepo }) => {
  return localeRepo.getAll();
});

class NewLocaleForm extends Component {
  static propTypes = {
    spaceLocales: PropTypes.arrayOf(PropTypes.object).isRequired,
    saveLocale: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
  };

  state = {
    isSaving: false,
    savedLocale: null,
  };

  onSaveLocale = (data) => {
    this.setState({ isSaving: true });
    return this.props
      .saveLocale({
        code: data.code || null,
        name: data.name || null,
        fallbackCode: data.fallbackCode || null,
        contentDeliveryApi: data.contentDeliveryApi || false,
        contentManagementApi: data.contentManagementApi || false,
        optional: data.optional || false,
      })
      .then((locale) => {
        this.props.setDirty(false);
        LocaleNotifications.saveSuccess();
        this.setState({ savedLocale: locale, isSaving: false });
      })
      .catch((err) => {
        this.props.setDirty(true);
        LocaleNotifications.saveError(err);
        this.setState({ isSaving: false });
      });
  };

  render() {
    if (this.state.savedLocale) {
      return (
        <RouteNavigate
          route={{ path: 'locales.detail', localeId: this.state.savedLocale.sys.id }}
          replace
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
          optional: false,
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

export function LocalesNewRoute(props) {
  const { currentSpaceId, currentEnvironmentId } = useSpaceEnvContext();
  const spaceEndpoint = useMemo(() => createSpaceEndpoint(currentSpaceId, currentEnvironmentId), [
    currentSpaceId,
    currentEnvironmentId,
  ]);
  const localeRepo = useMemo(() => createLocaleRepo(spaceEndpoint), [spaceEndpoint]);

  async function save(locale) {
    const savedLocale = await localeRepo.save(locale);
    await TheLocaleStore.refresh();
    return savedLocale;
  }

  if (!getSectionVisibility()['locales']) {
    return <ForbiddenPage />;
  }

  return (
    <React.Fragment>
      <DocumentTitle title="New Locale" />
      <LocalesFetcher localeRepo={localeRepo}>
        {({ isLoading, isError, data }) => {
          if (isLoading) {
            return <LocalesFormSkeleton />;
          }
          if (isError) {
            return <RouteNavigate route={{ path: 'locales.list' }} replace />;
          }
          const spaceLocales = data;
          return (
            <NewLocaleForm
              spaceLocales={spaceLocales}
              saveLocale={save}
              setDirty={props.setDirty}
              registerSaveAction={props.registerSaveAction}
            />
          );
        }}
      </LocalesFetcher>
    </React.Fragment>
  );
}

LocalesNewRoute.propTypes = {
  setDirty: PropTypes.func.isRequired,
  registerSaveAction: PropTypes.func.isRequired,
};
