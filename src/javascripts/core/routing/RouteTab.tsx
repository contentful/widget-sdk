import * as React from 'react';
import { useRouteProvider } from './RouteProvider';
import { Tab } from '@contentful/forma-36-react-components';
import { navigateToRoute } from './utils';

type Props = { url: string; name: string; label: string };

const RouteTab: React.FC<Props> = ({ url, name, label }) => {
  const currentPath = useRouteProvider();
  return (
    <Tab selected={currentPath === url} id={name} onSelect={navigateToRoute}>
      {label}
    </Tab>
  );
};
export { RouteTab };
