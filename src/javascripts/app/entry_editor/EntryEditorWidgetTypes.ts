export const DEFAULT_EDITOR_ID = 'default-editor';

export interface EntryEditorWidget {
  name: string;
  id: string;
  icon: string;
}

export default {
  DEFAULT_EDITOR: {
    name: 'Editor',
    id: DEFAULT_EDITOR_ID,
    icon: 'Entry',
  },
  REFERENCE_TREE: {
    name: 'References',
    id: 'reference-tree',
    icon: 'References',
  },
  TAGS_EDITOR: {
    name: 'Tags',
    id: 'tags-editor',
    icon: 'Tags',
  },
};
