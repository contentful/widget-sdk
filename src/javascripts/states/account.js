import accountProfileState from './accountProfile';
import {
  newOrganization,
  organizationSettings,
  organization,
} from 'app/OrganizationSettings/OrganizationSettingsState';
import EmptyNavigationBar from 'navigation/EmptyNavigationBar';

export default {
  name: 'account',
  url: '/account',
  abstract: true,
  navComponent: EmptyNavigationBar,
  children: [organizationSettings, newOrganization, organization, accountProfileState],
};
