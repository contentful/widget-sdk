import React, { Component } from 'react';
import { cloneDeep } from 'lodash';
import PropTypes from 'prop-types';
import { ModalLauncher } from 'core/components/ModalLauncher';
import { LocalesFormSkeleton } from '../skeletons/LocalesFormSkeleton';
import { LocaleEditForm } from '../LocaleEditForm';
import createFetcherComponent from 'app/common/createFetcherComponent';
import StateRedirect from 'app/common/StateRedirect';
import * as LocaleNotifications from '../utils/LocaleNotifications';
import { LocaleRemovalConfirmDialog } from '../dialogs/LocaleRemovalConfirmDialog';
import { ChooseNewFallbackLocaleDialog } from '../dialogs/ChooseNewFallbackLocaleDialog';
import { LocaleCodeChangeConfirmDialog } from '../dialogs/LocaleCodeChangeConfirmDialog';
import { getModule } from 'core/NgRegistry';
import { getSectionVisibility } from 'access_control/AccessChecker';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import DocumentTitle from 'components/shared/DocumentTitle';
import TheLocaleStore from 'services/localeStore';

const LocalesFetcher = createFetcherComponent(() => {
  const spaceContext = getModule('spaceContext');

  return spaceContext.localeRepo.getAll();
});

class EditLocaleForm extends Component {
  static propTypes = {
    initialLocale: PropTypes.object.isRequired,
    spaceLocales: PropTypes.arrayOf(PropTypes.object).isRequired,
    saveLocale: PropTypes.func.isRequired,
    removeLocale: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    goToList: PropTypes.func.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
  };

  state = {
    isSaving: false,
    isDeleting: false,
    isDeleted: false,
  };

  updateDependantLocales = (dependantLocales, newFallbackCode) => {
    const { spaceLocales, saveLocale } = this.props;
    return Promise.all(
      dependantLocales.map((locale) => {
        const localeToUpdate = spaceLocales.find((item) => item.code === locale.code);
        if (localeToUpdate) {
          const data = cloneDeep(localeToUpdate);
          data.fallbackCode = newFallbackCode || null;
          return saveLocale(data);
        } else {
          return Promise.resolve();
        }
      })
    );
  };

  openRemovalConfirmation = (locale) => {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <LocaleRemovalConfirmDialog
        isShown={isShown}
        locale={locale}
        onConfirm={() => {
          onClose(true);
        }}
        onCancel={() => {
          onClose(false);
        }}
      />
    ));
  };

  openChooseNewFallbackConfirmation = (locale, dependantLocales, availableLocales) => {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <ChooseNewFallbackLocaleDialog
        isShown={isShown}
        locale={locale}
        dependantLocales={dependantLocales}
        availableLocales={availableLocales}
        onConfirm={(newFallbackCode) => {
          onClose(newFallbackCode);
        }}
        onCancel={() => {
          onClose(false);
        }}
      />
    ));
  };

  openLocaleCodeChangeConfirmation = (locale, previousLocale) => {
    return ModalLauncher.open(({ isShown, onClose }) => (
      <LocaleCodeChangeConfirmDialog
        isShown={isShown}
        locale={locale}
        previousLocale={previousLocale}
        onCancel={() => {
          onClose(false);
        }}
        onConfirm={() => {
          onClose(true);
        }}
      />
    ));
  };

  onSaveLocale = async (locale, initialLocale, localeList) => {
    if (locale.code !== initialLocale.code) {
      if (localeList.hasDependantLocales(initialLocale.code)) {
        LocaleNotifications.notRenameable();
        return;
      }
      const confirmChangeLocale = await this.openLocaleCodeChangeConfirmation(
        locale,
        initialLocale
      );
      if (!confirmChangeLocale) {
        return;
      }
    }
    this.setState({ isSaving: true });
    try {
      await this.props.saveLocale(locale);
      LocaleNotifications.saveSuccess();
      this.props.setDirty(false);
    } catch (err) {
      LocaleNotifications.saveError(err);
    }
    this.setState({ isSaving: false });
  };

  onDeleteLocale = async (locale, localeList) => {
    this.setState({ isDeleting: true });
    try {
      const confirmedRemoval = await this.openRemovalConfirmation(locale);
      if (!confirmedRemoval) {
        this.setState({ isDeleting: false });
        return;
      }
      const hasDependantLocales = localeList.hasDependantLocales(locale.code);
      if (hasDependantLocales) {
        const dependantLocales = localeList.getDependantLocales(locale.code);
        const availableLocales = localeList.getAvailableFallbackLocales(locale.code);
        const newFallbackCode = await this.openChooseNewFallbackConfirmation(
          locale,
          dependantLocales,
          availableLocales
        );
        if (typeof newFallbackCode !== 'string') {
          this.setState({ isDeleting: false });
          return;
        }
        await this.updateDependantLocales(dependantLocales, newFallbackCode);
      }
      await this.props.removeLocale(locale.sys.id, locale.sys.version);
      LocaleNotifications.deleteSuccess();
      this.props.setDirty(false);
      this.setState({ isDeleting: false, isDeleted: true });
    } catch (err) {
      LocaleNotifications.deleteError(err);
      this.setState({ isDeleting: false });
    }
  };

  render() {
    if (this.state.isDeleted) {
      return <StateRedirect path="^.list" />;
    }
    const isDefaultLocale = !!this.props.initialLocale.default;
    return (
      <LocaleEditForm
        initialLocale={this.props.initialLocale}
        spaceLocales={this.props.spaceLocales}
        isSaving={this.state.isSaving}
        onSave={this.onSaveLocale}
        onDelete={isDefaultLocale ? null : this.onDeleteLocale}
        isDeleting={this.state.isDeleting}
        setDirty={this.props.setDirty}
        goToList={this.props.goToList}
        registerSaveAction={this.props.registerSaveAction}
      />
    );
  }
}

export class LocalesEditRoute extends React.Component {
  save = async function (locale) {
    const spaceContext = getModule('spaceContext');

    const savedLocale = await spaceContext.localeRepo.save(locale);
    await TheLocaleStore.refresh();
    return savedLocale;
  };

  remove = async function (locale) {
    const spaceContext = getModule('spaceContext');

    await spaceContext.localeRepo.remove(locale);
    await TheLocaleStore.refresh();
  };

  render() {
    if (!getSectionVisibility()['locales']) {
      return <ForbiddenPage />;
    }

    return (
      <LocalesFetcher>
        {({ isLoading, isError, data, fetch }) => {
          if (isLoading) {
            return <LocalesFormSkeleton />;
          }
          if (isError) {
            return <StateRedirect path="^.list" />;
          }
          const spaceLocales = data;
          const locale = spaceLocales.find((locale) => locale.sys.id === this.props.localeId);
          if (!locale) {
            return <StateRedirect path="^.list" />;
          }

          return (
            <React.Fragment>
              <DocumentTitle title={[locale.name, 'Locales']} />
              <EditLocaleForm
                initialLocale={locale}
                spaceLocales={spaceLocales}
                saveLocale={(locale) =>
                  this.save(locale).then(() => {
                    fetch();
                  })
                }
                removeLocale={this.remove}
                setDirty={this.props.setDirty}
                goToList={this.props.goToList}
                registerSaveAction={this.props.registerSaveAction}
              />
            </React.Fragment>
          );
        }}
      </LocalesFetcher>
    );
  }
}

LocalesEditRoute.propTypes = {
  localeId: PropTypes.string.isRequired,
  setDirty: PropTypes.func.isRequired,
  goToList: PropTypes.func.isRequired,
  registerSaveAction: PropTypes.func.isRequired,
};
