import * as React from 'react';
import { TagsRepoType } from 'features/content-tags/types';

const TagsRepoContext = React.createContext<TagsRepoType | undefined>(undefined);

export { TagsRepoContext };
