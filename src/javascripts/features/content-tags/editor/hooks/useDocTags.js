import { useCallback } from 'react';

const METADATA_TAGS_PATH = ['metadata', 'tags'];

const useDocTags = ({ getValueAt, setValueAt }) => {
  const tags = getValueAt(METADATA_TAGS_PATH);
  const setTags = useCallback(
    async (tags) => {
      await setValueAt(
        METADATA_TAGS_PATH,
        tags.map((tag) => ({
          sys: {
            id: tag,
            type: 'Link',
            linkType: 'Tag',
          },
        }))
      );
    },
    [setValueAt]
  );
  return { tags, setTags };
};

export { useDocTags };
