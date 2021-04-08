import React, { ReactElement } from 'react';
import { AppBundleData } from '../AppEditor';

interface HostingStateContextValue {
  isAppHosting: boolean;
  setIsAppHosting: (val: boolean) => void;
  bundles: AppBundleData[];
  addBundle: (newBundle: AppBundleData) => void;
  removeBundle: (newBundle: AppBundleData) => void;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const HostingStateContext = React.createContext<HostingStateContextValue>(null!);

export interface HostingStateProviderProps {
  children: ReactElement;
  defaultValue: boolean;
  bundles: { items: AppBundleData[] };
}

export const HostingStateProvider = ({
  children,
  defaultValue,
  bundles,
}: HostingStateProviderProps) => {
  const [isAppHosting, setIsAppHosting] = React.useState<boolean>(!!defaultValue);
  const [savedBundles, setBundle] = React.useState<AppBundleData[]>(bundles.items);
  const addBundle = React.useCallback((newBundle) => setBundle(savedBundles.concat(newBundle)), [
    savedBundles,
    setBundle,
  ]);

  const removeBundle = React.useCallback(
    (bundleToRemove) => {
      const newBundles = savedBundles.filter(({ sys: { id } }) => id !== bundleToRemove.sys.id);
      setBundle(newBundles);
    },
    [savedBundles, setBundle]
  );

  return (
    <HostingStateContext.Provider
      value={{
        isAppHosting,
        setIsAppHosting,
        bundles: savedBundles,
        addBundle,
        removeBundle,
      }}>
      {children}
    </HostingStateContext.Provider>
  );
};
