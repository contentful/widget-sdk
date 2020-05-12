import React from 'react';
import { organizationRoute } from 'states/utils';
import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import importer from 'app/OrganizationSettings/importer';
import { TeamDetailsRoute } from 'features/teams';

const teamDetailState = organizationRoute({
  name: 'detail',
  url: '/:teamId',
  component: (props) => <TeamDetailsRoute {...props} />,
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
