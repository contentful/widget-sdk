export interface AppTrial {
  spaceKey: string;
  trial: {
    startedAt: string;
    endsAt: string;
  };
}

export interface AppTrialFeature {
  name: string;
  enabled: boolean;
  sys: {
    feature_id: string;
    id: string;
    organization: {
      sys: {
        id: string;
      };
    };
    trial?: {
      startedAt: string;
      endsAt: string;
    };
  };
}
