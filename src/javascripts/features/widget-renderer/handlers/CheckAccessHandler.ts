import { AccessAPI } from 'contentful-ui-extensions-sdk';

export const makeCheckAccessHandler = (accessApi: AccessAPI) => accessApi.can;
