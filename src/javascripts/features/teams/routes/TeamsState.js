import React from 'react';
import { organizationRoute } from 'states/utils';
import { TeamDetailsRoute } from './TeamDetailsRoute';
import { TeamListRoute } from './TeamListRoute';

const teamDetailState = organizationRoute({
  name: 'detail',
  url: '/:teamId',
  component: (props) => <TeamDetailsRoute {...props} />,
});

export const teamsState = organizationRoute({
  name: 'teams',
  children: [teamDetailState],
  url: '/teams',
  component: (props) => <TeamListRoute {...props} />,
});
