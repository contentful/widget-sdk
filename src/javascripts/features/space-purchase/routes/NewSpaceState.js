import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import { importer } from './importer';

export const newSpaceState = organizationRoute({
  name: 'new_space',
  url: '/new_space',
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ NewSpaceRoute }) => {
        return <NewSpaceRoute {...props} />;
      }}
    </LazyLoadedComponent>
  ),
});
