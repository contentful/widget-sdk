import { WidgetRendererProps } from '../WidgetRenderer';

export interface AccessAPI {
  can: (action: string, entityType: string) => Promise<boolean>;
}

export const makeCheckAccessHandler = (accessApi: WidgetRendererProps['apis']['access']) => {
  return async function (action: string, entityType: string) {
    return accessApi.can(action, entityType);
  };
};
