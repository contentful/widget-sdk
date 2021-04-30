import type { Sys } from 'core/services/SpaceEnvContext/types';

export interface UserData {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  email: string;
  cookieConsentData: unknown;
  activated: boolean;
  signInCount: number;
  confirmed: boolean;
  '2faEnabled': boolean;
  intercomUserSignature: string;
  sys: Sys;
  identities: Identity[];
  logAnalyticsFeature: boolean;
  mfaEligible: boolean;
  mfaEnabled: boolean;
  passwordSet: boolean;
  ssoLoginOnly: boolean;
  unconfirmedEmail?: boolean;
  userCancellationWarning: {
    singleOwnerOrganizations: Array<{ name: string; spacesNames: string[] }>;
  };
}

export interface Identity {
  sys: Sys;
  provider: 'google_oauth2' | 'github' | 'twitter';
}

export enum AccountDeletionReasons {
  other_solution = "I've found another solution",
  not_useful = "I don't find it useful",
  dont_understand = "I don't understand how to use it",
  temporary = "It's temporary. I'll be back",
  other = 'Other',
}
