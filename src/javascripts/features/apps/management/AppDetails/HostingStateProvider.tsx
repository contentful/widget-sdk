import React, { ReactElement } from 'react';
import { AppBundleData, AppBundleDataWithCreator } from '../AppEditor';
import createUserCache from 'data/userCache';
import { createOrganizationEndpoint } from 'data/EndpointFactory';

interface HostingStateContextValue {
  isAppHosting: boolean;
  setIsAppHosting: (val: boolean) => void;
  bundles: AppBundleDataWithCreator[];
  addBundle: (newBundle: AppBundleData) => void;
  removeBundle: (newBundle: AppBundleData) => void;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const HostingStateContext = React.createContext<HostingStateContextValue>(null!);

export interface HostingStateProviderProps {
  children: ReactElement;
  defaultValue: boolean;
  bundles: { items: AppBundleData[] };
  orgId: string;
}

export const HostingStateProvider = ({
  children,
  defaultValue,
  bundles,
  orgId,
}: HostingStateProviderProps) => {
  const spaceEndpoint = React.useMemo(() => createOrganizationEndpoint(orgId), [orgId]);
  const usersRepo = React.useMemo(() => createUserCache(spaceEndpoint), [spaceEndpoint]);

  const [isAppHosting, setIsAppHosting] = React.useState<boolean>(!!defaultValue);
  const [savedBundles, setBundle] = React.useState<AppBundleData[]>(bundles.items);
  const [resolvedBundles, setResolvedBundles] = React.useState<AppBundleDataWithCreator[]>([]);
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

  React.useEffect(() => {
    Promise.all(savedBundles.map((bundle) => resolvedCreatedByInBundle(usersRepo, bundle))).then(
      (newResolvedBundles) => {
        setResolvedBundles(newResolvedBundles);
      }
    );
  }, [savedBundles, usersRepo]);

  return (
    <HostingStateContext.Provider
      value={{
        isAppHosting,
        setIsAppHosting,
        bundles: resolvedBundles,
        addBundle,
        removeBundle,
      }}>
      {children}
    </HostingStateContext.Provider>
  );
};

const resolvedCreatedByInBundle = async (usersRepo, bundle): Promise<AppBundleDataWithCreator> => {
  const user = await usersRepo.get(bundle.sys.createdBy.sys.id);
  return { ...bundle, sys: { ...bundle.sys, createdBy: user } };
};
