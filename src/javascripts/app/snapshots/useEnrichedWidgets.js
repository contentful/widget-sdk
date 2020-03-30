import { useEffect, useState } from 'react';
import { getFieldPath } from './utils';
import { get, isEqual } from 'lodash';
import TheLocaleStore from 'services/localeStore';

const getLocalesForField = field => {
  const fieldLocales = field.localized
    ? TheLocaleStore.getPrivateLocales()
    : [TheLocaleStore.getDefaultLocale()];
  return fieldLocales.filter(TheLocaleStore.isLocaleActive);
};

const useEnrichedWidgets = ({ widgets, getEditorData, snapshot }) => {
  const [state, setState] = useState({ enrichedWidgets: [], diffCount: 0 });

  useEffect(() => {
    const editorData = getEditorData();
    const entry = get(editorData, 'entity', {});

    const enrichedWidgets = widgets.map((widget) => {
      const { field } = widget;
      const locales = getLocalesForField(field);
      const hasMultipleLocales = locales.length > 1;
      return {
        widget,
        hasMultipleLocales,
        locales: locales.map((locale) => {
          const { internal_code } = locale;

          const fieldPath = getFieldPath(field.id, internal_code);
          const currentVersion = get(entry, ['data'].concat(fieldPath));
          const snapshotVersion = get(snapshot, ['snapshot'].concat(fieldPath));
          return {
            locale,
            fieldPath: fieldPath.join('.'),
            isDifferent: !isEqual(currentVersion, snapshotVersion),
          };
        }),
      };
    });

    const diffCount = enrichedWidgets.reduce(
      (red, { locales }) => [...red, ...locales.filter(({ isDifferent }) => isDifferent)],
      []
    ).length;

    setState({ diffCount, enrichedWidgets });
  }, [widgets, getEditorData, snapshot]);

  return [state];
};

export default useEnrichedWidgets;
