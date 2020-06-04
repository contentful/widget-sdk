import React from 'react';
import { organizationRoute } from 'states/utils';
import { TeamDetailsRoute, TeamListRoute } from 'features/teams';

const teamDetailState = organizationRoute({
  name: 'detail',
  url: '/:teamId',
  component: (props) => <TeamDetailsRoute {...props} />,
});

export default organizationRoute({
  name: 'teams',
  children: [teamDetailState],
  url: '/teams',
  component: (props) => <TeamListRoute {...props} />,
});
