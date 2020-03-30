import { useState } from 'react';
import { SNAPSHOT, CURRENT, getFieldPath } from './utils';

const getPathsToRestore = (selected) => {
  return Object.entries(selected)
    .filter(([, version]) => version === SNAPSHOT)
    .map(([path]) => path.split('.'));
};

const initSelected = enrichedWidgets => {
  return enrichedWidgets.reduce(
    (red, { widget: { field }, locales }) => ({
      ...red,
      ...locales.reduce((loc, { locale: { internal_code } }) => {
        const fieldPath = getFieldPath(field.id, internal_code).join('.');
        return { ...loc, [fieldPath]: CURRENT };
      }, {}),
    }),
    {}
  );
};

const getAllAvailableSnapshotFields = (enrichedWidgets) =>
  enrichedWidgets.reduce(
    (red, { locales }) => ({
      ...red,
      ...locales.reduce(
        (loc, { isDifferent, fieldPath }) => ({
          ...loc,
          [fieldPath]: isDifferent ? SNAPSHOT : CURRENT,
        }),
        {}
      ),
    }),
    {}
  );

const useSelectedVersions = ({ enrichedWidgets }) => {
  const [selectedVersions, setSelectedVersions] = useState(initSelected(enrichedWidgets));

  const setSelectedVersionForField = (path, version) => {
    setSelectedVersions((selected) => ({ ...selected, [path]: version }));
  };

  const setSelectAllSnapshots = () => {
    setSelectedVersions(getAllAvailableSnapshotFields(enrichedWidgets));
  };

  return [
    {
      selectedVersions,
      pathsToRestore: getPathsToRestore(selectedVersions),
    },
    {
      setSelectedVersionForField,
      setSelectAllSnapshots,
    },
  ];
};

export default useSelectedVersions;
