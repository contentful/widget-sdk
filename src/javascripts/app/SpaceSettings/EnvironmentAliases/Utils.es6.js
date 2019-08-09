import { createSpaceEndpoint } from 'data/EndpointFactory.es6';

export const STEPS = {
  IDLE: 'IDLE',
  FIRST_ALIAS: 'FIRST_ALIAS',
  SECOND_RENAMING: 'SECOND_RENAMING',
  THIRD_CHANGE_ENV: 'THIRD_CHANGE_ENV'
};

const alphaHeader = { 'X-Contentful-Enable-Alpha-Feature': 'environment-aliasing' };

export function handleOptIn(spaceId, newEnvironmentId) {
  const endpoint = createSpaceEndpoint(spaceId);
  return endpoint(
    {
      method: 'PUT',
      path: ['optin', 'environment-aliases'],
      data: {
        newEnvironmentId
      }
    },
    alphaHeader
  );
}

export function handleChangeEnvironment(spaceId, alias, aliasedEnvironment) {
  const endpoint = createSpaceEndpoint(spaceId);
  return endpoint(
    {
      method: 'PUT',
      path: ['environment_aliases', alias],
      data: {
        environment: {
          sys: {
            id: aliasedEnvironment,
            type: 'Link',
            linkType: 'Environment'
          }
        }
      }
    },
    alphaHeader
  );
}
