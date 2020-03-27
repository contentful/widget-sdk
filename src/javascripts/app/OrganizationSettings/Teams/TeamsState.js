import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';

const teamDetailState = organizationRoute({
  name: 'detail',
  url: '/:teamId',
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ TeamPage }) => {
        return <TeamPage {...props} />;
      }}
    </LazyLoadedComponent>
  ),
});

export default organizationRoute({
  name: 'teams',
  children: [teamDetailState],
  url: '/teams',
  component: (props) => (
    <LazyLoadedComponent importer={importer}>
      {({ TeamPage }) => {
        return <TeamPage {...props} />;
      }}
    </LazyLoadedComponent>
  ),
});
