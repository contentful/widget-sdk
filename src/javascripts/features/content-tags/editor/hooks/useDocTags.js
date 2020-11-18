import { useCallback, useMemo } from 'react';
import { tagLink } from 'features/content-tags/editor/utils';

const METADATA_TAGS_PATH = ['metadata', 'tags'];

const useDocTags = (doc) => {
  const tags = useMemo(() => doc.getValueAt(METADATA_TAGS_PATH) || [], [doc]);
  const setTags = useCallback(
    async (tags) => {
      await doc.setValueAt(METADATA_TAGS_PATH, tags.map(tagLink));
    },
    [doc]
  );
  return { tags, setTags };
};

export { useDocTags };
