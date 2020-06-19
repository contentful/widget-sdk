import { useCallback } from 'react';
import { tagLink } from 'features/content-tags/editor/utils';

const METADATA_TAGS_PATH = ['metadata', 'tags'];

const useDocTags = ({ getValueAt, setValueAt }) => {
  const tags = getValueAt(METADATA_TAGS_PATH);
  const setTags = useCallback(
    async (tags) => {
      await setValueAt(METADATA_TAGS_PATH, tags.map(tagLink));
    },
    [setValueAt]
  );
  return { tags, setTags };
};

export { useDocTags };
