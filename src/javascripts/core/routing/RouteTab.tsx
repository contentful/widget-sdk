import * as React from 'react';
import { useRouteProvider } from './RouteProvider';
import { Tab } from '@contentful/forma-36-react-components';
import { navigateToRoute } from './utils';

type Props = { url: string; name: string; label: string; onSelect?: (value) => void };

const RouteTab: React.FC<Props> = ({ url, name, label, onSelect }) => {
  const currentPath = useRouteProvider();
  return (
    <Tab selected={currentPath === url} id={name} onSelect={onSelect || navigateToRoute}>
      {label}
    </Tab>
  );
};
export { RouteTab };
