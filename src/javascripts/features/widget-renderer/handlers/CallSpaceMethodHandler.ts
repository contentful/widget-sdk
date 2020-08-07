import { SpaceAPI } from 'contentful-ui-extensions-sdk';

export const makeCallSpaceMethodHandler = (spaceApi: SpaceAPI) => {
  return async function (methodName: string, args: any[] = []) {
    const method = spaceApi[methodName];
    if (!method) {
      throw new Error(`Unknown method "${methodName}".`);
    }

    try {
      return await method(...args);
    } catch ({ code, body }) {
      throw Object.assign(new Error('Request failed.'), { code, data: body });
    }
  };
};
