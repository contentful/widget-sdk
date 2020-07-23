import { FieldAPI as _FieldAPI } from 'contentful-ui-extensions-sdk';
import { WidgetRendererProps } from '../WidgetRenderer';

export type FieldAPI = _FieldAPI;

export const makeSetValueHandler = (fieldAPI: WidgetRendererProps['apis']['field']) => {
  return async function (id: string, locale: string, value: any) {
    if (id === fieldAPI?.id && locale === fieldAPI.locale) {
      return fieldAPI?.setValue(value);
    }

    throw Object.assign(new TypeError('Unmatched (id, locale) pair'), { data: { id, locale } });
  };
};
