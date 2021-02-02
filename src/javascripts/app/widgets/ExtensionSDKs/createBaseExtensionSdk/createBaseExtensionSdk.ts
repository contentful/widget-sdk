import {
  BaseExtensionSDK,
  SpaceAPI,
  ParametersAPI,
  LocationAPI,
  NavigatorAPI,
} from 'contentful-ui-extensions-sdk';
import { createAccessApi } from '../createAccessApi';
import { Notification } from '@contentful/forma-36-react-components';
import { createLocalesApi } from '../createLocalesApi';
import { createUserApi, SpaceMember } from '../createUserApi';

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
  const notifierApi = Notification;
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
