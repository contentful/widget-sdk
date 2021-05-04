import {
  BaseExtensionSDK,
  SpaceAPI,
  ParametersAPI,
  LocationAPI,
  NavigatorAPI,
} from '@contentful/app-sdk';
import { createAccessApi } from '../createAccessApi';
import { createLocalesApi } from '../createLocalesApi';
import { createUserApi, SpaceMember } from '../createUserApi';
import { createNotifierApi } from '../createNotifierApi';

interface SharedBasedWidgetSDK {
  spaceApi: SpaceAPI;
  parametersApi: ParametersAPI;
  locationApi: LocationAPI;
  spaceMember: SpaceMember;
  navigatorApi: NavigatorAPI;
}

export const createBaseExtensionSdk = ({
  parametersApi,
  spaceMember,
  locationApi,
  spaceApi,
  navigatorApi,
}: SharedBasedWidgetSDK): Omit<BaseExtensionSDK, 'dialogs' | 'ids'> => {
  const accessApi = createAccessApi(spaceApi);
  const localesApi = createLocalesApi();
  const notifierApi = createNotifierApi();
  const userApi = createUserApi(spaceMember);

  return {
    space: spaceApi,
    user: userApi,
    locales: localesApi,
    navigator: navigatorApi,
    notifier: notifierApi,
    parameters: parametersApi,
    location: locationApi,
    access: accessApi,
  };
};
