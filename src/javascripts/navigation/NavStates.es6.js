import {makeSum} from 'libs/sum-types';

/**
 * Possible app states for navigation (sidepanel_trigger_directive)
 */

export const NavStates = makeSum({
  Space: ['space', 'org'],
  OrgSettings: ['org'],
  UserProfile: [],
  NewOrg: [],
  Default: []
});
