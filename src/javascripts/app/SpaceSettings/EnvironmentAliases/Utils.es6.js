import { createSpaceEndpoint } from 'data/EndpointFactory.es6';

export const STEPS = {
  IDLE: 0,
  FIRST_ALIAS: 1,
  SECOND_RENAMING: 2,
  THIRD_CHANGE_ENV: 3
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
      path: ['environment_aliases', alias.sys.id],
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
    {
      ...alphaHeader,
      'X-Contentful-Version': alias.sys.version
    }
  );
}
