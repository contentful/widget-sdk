import React from 'react';
import { withOrganizationRoute } from 'states/withOrganizationRoute';
import { TeamDetailsRoute } from './TeamDetailsRoute';
import { TeamListRoute } from './TeamListRoute';

const teamDetailState = {
  name: 'detail',
  url: '/:teamId',
  component: withOrganizationRoute((props) => <TeamDetailsRoute {...props} />),
};

export const teamsState = {
  name: 'teams',
  children: [teamDetailState],
  url: '/teams',
  component: withOrganizationRoute((props) => <TeamListRoute {...props} />),
};
