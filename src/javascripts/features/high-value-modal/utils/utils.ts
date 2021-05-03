import { track } from 'analytics/Analytics';

export const CUSTOM_ROLES_CONTENT_ENTRY_ID = '57081bvT4YDJecjTT8P2CZ';
export const TEAMS_CONTENT_ENTRY_ID = '1latlrTvD7j105w3WBlxjS';
export const REFERENCES_ENTRY_ID = '4EzGcYbWpaz09RoG6ol6Yl';

export const ROLES_AND_PERMISSIONS_TRACKING_NAME = 'roles_and_permissions';
export const TEAMS_TRACKING_NAME = 'teams';
export const REFERENCES_TRACKING_NAME = 'references';

export const handleHighValueLabelTracking = (action, feature, isOrgOnTrial) => {
  track(`high_value_feature:${action}`, {
    userType: isOrgOnTrial ? 'community_on_enterprise_trial' : 'community',
    feature: feature,
  });
};
