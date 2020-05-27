import { useCallback } from 'react';

const METADATA_TAGS_PATH = ['metadata', 'tags'];

const useDocTags = (doc) => {
  const tags = doc.getValueAt(METADATA_TAGS_PATH);
  const setTags = useCallback(
    async (tags) => {
      await doc.setValueAt(
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
    [doc]
  );
  return { tags, setTags };
};

export { useDocTags };
