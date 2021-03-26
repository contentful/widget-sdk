import LazyLoadedComponent from 'app/common/LazyLoadedComponent';
import React from 'react';
import { AppEditorProps } from './AppEditor';

async function importer() {
  return await import(/* webpackChunkName: "app-editor" */ './AppEditor');
}

export const LazyLoadedAppEditor = (props: AppEditorProps) => (
  <LazyLoadedComponent importer={importer}>
    {({ AppEditor }) => <AppEditor {...props} />}
  </LazyLoadedComponent>
);
