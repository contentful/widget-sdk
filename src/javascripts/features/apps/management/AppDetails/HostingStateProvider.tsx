import React, { ReactElement } from 'react';
import { AppBundleData } from '../AppEditor';

interface HostingStateContextValue {
  isAppHosting: boolean;
  setIsAppHosting: (val: boolean) => void;
  bundles: AppBundleData[];
  addBundle: (newBundle: AppBundleData) => void;
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

  return (
    <HostingStateContext.Provider
      value={{
        isAppHosting,
        setIsAppHosting,
        bundles: savedBundles,
        addBundle,
      }}>
      {children}
    </HostingStateContext.Provider>
  );
};
