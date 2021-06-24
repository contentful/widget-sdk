import type { Trial } from '@contentful/experience-cma-utils';
import moment from 'moment';
import { getSpaces } from 'services/TokenStore';
import { OrganizationFeatures } from 'data/CMA/ProductCatalog';

export const calcTrialDaysLeft = (trialEndDate?: string | null) => {
  if (!trialEndDate) {
    return -1;
  }
  return Math.abs(moment().startOf('day').diff(moment(trialEndDate), 'days'));
};

export const isSpaceAccessible = async (spaceId?: string) => {
  if (!spaceId) {
    return false;
  }

  const accessibleSpaces = await getSpaces();

  return !!accessibleSpaces.find((space) => space.sys.id === spaceId);
};

export const isActive = (trial?: Trial) => {
  if (!trial) {
    return false;
  }

  const today = new Date(new Date().toDateString());
  const endsAt = new Date(trial.endsAt);
  return today <= endsAt;
};

export const hasExpired = (trial?: Trial) => {
  if (!trial) {
    return false;
  }

  const today = new Date(new Date().toDateString());
  const endsAt = new Date(trial.endsAt);
  return today > endsAt;
};

export const isAppsTrial = (trial: Trial) =>
  Boolean(
    !trial.sys.parent &&
      trial.sys.organization &&
      trial.sys.features?.includes(OrganizationFeatures.PC_ORG_COMPOSE_APP)
  );

export const isAppsTrialSpace = (trial: Trial) => Boolean(trial.sys.parent && trial.sys.space);

export const isTrialSpace = (trial: Trial) => Boolean(trial.sys.space);
