import * as React from 'react';
import { LocalesEditRoute, LocalesListRoute, LocalesNewRoute } from 'features/locales-management';
import { window } from 'core/services/window';
import StateRedirect from 'app/common/StateRedirect';
import { RouteErrorBoundary, Route, Routes, CustomRouter } from 'core/react-routing';
import { useUnsavedChangesModal } from 'core/hooks/useUnsavedChangesModal/useUnsavedChangesModal';

function withUnsavedChangesDialog(Component) {
  return function WithUnsavedChangesDialog(props) {
    const { registerSaveAction, setDirty } = useUnsavedChangesModal();
    return <Component {...props} setDirty={setDirty} registerSaveAction={registerSaveAction} />;
  };
}

const LocaleRouter = () => {
  const [basename] = window.location.pathname.split('locales');
  const UnsavedNewRoute = withUnsavedChangesDialog(LocalesNewRoute);
  const UnsavedEditRoute = withUnsavedChangesDialog(LocalesEditRoute);

  return (
    <CustomRouter splitter="settings/locales">
      <RouteErrorBoundary>
        <Routes basename={basename + 'locales'}>
          <Route path="/" element={<LocalesListRoute />} />
          <Route path="/new" element={<UnsavedNewRoute />} />
          <Route path="/:localeId" element={<UnsavedEditRoute />} />
          <Route path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
};

export const localesSettingsState = {
  name: 'locales',
  url: '/locales{pathname:any}',
  component: LocaleRouter,
};
