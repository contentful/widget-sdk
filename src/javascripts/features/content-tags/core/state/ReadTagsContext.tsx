import React from 'react';
import { Tag } from '@contentful/types';

type ReadTagsContextType = {
  total: number;
  data: Tag[];
  isLoading: boolean;
  error?: any;
  reset: () => void;
  hasTags: boolean;
  nameExists: (name: string) => boolean;
  idExists: (id: string) => boolean;
  getTag: (id: string) => Tag | undefined;
  addTag: (tag: Tag) => void;
};

const ReadTagsContext = React.createContext<ReadTagsContextType | undefined>(undefined);

export { ReadTagsContext };
