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
