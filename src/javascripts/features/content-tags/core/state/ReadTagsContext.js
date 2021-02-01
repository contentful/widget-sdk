import React from 'react';

const ReadTagsContext = React.createContext({
  data: [],
  addTag: null,
  isLoading: false,
  error: null,
  reset: null,
  hasTags: false,
  nameExists: null,
  idExists: null,
  getTag: null,
});

export { ReadTagsContext };
