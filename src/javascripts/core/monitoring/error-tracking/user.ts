import type { User } from 'core/services/SpaceEnvContext/types';
import {
  setUser as originalSetUser,
  User as SentryUser,
} from '@contentful/experience-error-tracking';
import * as Config from 'Config';

const getSentryUser = (user: User): SentryUser => {
  const id = user.sys.id;
  const adminLink = 'https://admin.' + Config.domain + '/admin/users/' + id;

  const organizations = user.organizationMemberships?.map(
    (membership) => membership.organization.sys.id
  );

  return {
    id,
    adminLink,
    organizations,
  };
};

export const setUser = (user: User) => {
  originalSetUser(getSentryUser(user));
};
