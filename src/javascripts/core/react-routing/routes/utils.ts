import { EnvironmentParams } from './types';

export const spaceEnvBase = (params: EnvironmentParams, appendix: string) => {
  return [params.withEnvironment ? 'spaces.environment' : 'spaces.detail', appendix]
    .filter(Boolean)
    .join('.');
};
