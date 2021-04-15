import React from 'react';
import { useRouteNavigate } from './useRouteNavigate';

export function withRouteNavigate<T extends any>(WrappedComponent: React.ComponentType<T>) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithNavigator = (props: Omit<T, 'navigate'>) => {
    const navigate = useRouteNavigate();
    return <WrappedComponent {...(props as T)} navigate={navigate} />;
  };

  ComponentWithNavigator.displayName = `withNavigator(${displayName})`;

  return ComponentWithNavigator;
}
