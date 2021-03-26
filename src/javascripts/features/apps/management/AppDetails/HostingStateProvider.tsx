import React, { ReactElement } from 'react';

interface HostingStateContextValue {
  isAppHosting: boolean;
  setIsAppHosting: (val: boolean) => void;
}

export const HostingStateContext = React.createContext<HostingStateContextValue | null>(null);

interface HostingStateProviderProps {
  children: ReactElement;
  defaultValue?: boolean;
}

export const HostingStateProvider = ({ children, defaultValue }: HostingStateProviderProps) => {
  const [isAppHosting, setIsAppHosting] = React.useState(!!defaultValue);

  return (
    <HostingStateContext.Provider value={{ isAppHosting, setIsAppHosting }}>
      {children}
    </HostingStateContext.Provider>
  );
};
