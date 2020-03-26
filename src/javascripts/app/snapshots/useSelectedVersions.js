import { useState } from 'react';
import TheLocaleStore from 'services/localeStore';
import { SNAPSHOT, CURRENT } from './SnapshotComparator';

export const getLocalesForField = field => {
  const fieldLocales = field.localized
    ? TheLocaleStore.getPrivateLocales()
    : [TheLocaleStore.getDefaultLocale()];
  return fieldLocales.filter(TheLocaleStore.isLocaleActive);
};

export const getFieldPath = (fieldId, internalCode) => ['fields', fieldId, internalCode];

const getPathsToRestore = selected => {
  return Object.entries(selected)
    .filter(([, version]) => version === SNAPSHOT)
    .map(([path]) => path.split('.'));
};

const initSelected = widgets => {
  return widgets.reduce(
    (red, { field }) => ({
      ...red,
      ...getLocalesForField(field).reduce((loc, { internal_code }) => {
        const fieldPath = getFieldPath(field.id, internal_code).join('.');
        return { ...loc, [fieldPath]: CURRENT };
      }, {})
    }),
    {}
  );
};

const getAllAvailableSnapshotFields = enrichedWidgets =>
  enrichedWidgets.reduce(
    (red, { locales }) => ({
      ...red,
      ...locales.reduce(
        (loc, { isDifferent, fieldPath }) => ({
          ...loc,
          [fieldPath]: isDifferent ? SNAPSHOT : CURRENT
        }),
        {}
      )
    }),
    {}
  );

const useSelectedVersions = ({ widgets }) => {
  const [selectedVersions, setSelectedVersions] = useState(initSelected(widgets));

  const setSelectedVersionForField = (path, version) => {
    setSelectedVersions(selected => ({ ...selected, [path]: version }));
  };

  const setSelectAllSnapshots = enrichedWidgets => {
    setSelectedVersions(getAllAvailableSnapshotFields(enrichedWidgets));
  };

  return [
    {
      selectedVersions,
      pathsToRestore: getPathsToRestore(selectedVersions)
    },
    {
      setSelectedVersionForField,
      setSelectAllSnapshots
    }
  ];
};

export default useSelectedVersions;
