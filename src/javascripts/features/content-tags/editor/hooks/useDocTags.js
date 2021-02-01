import { useCallback, useState } from 'react';
import { tagLink } from 'features/content-tags/editor/utils';

const METADATA_TAGS_PATH = ['metadata', 'tags'];

const useDocTags = (doc) => {
  const [tags, setLocalTags] = useState(() => doc.getValueAt(METADATA_TAGS_PATH) || []);
  const setTags = useCallback(
    async (tags) => {
      await doc.setValueAt(METADATA_TAGS_PATH, tags.map(tagLink));
      setLocalTags(doc.getValueAt(METADATA_TAGS_PATH));
    },
    [doc]
  );
  return { tags, setTags };
};

export { useDocTags };
