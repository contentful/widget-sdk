import React from 'react';
import DocumentTitle from 'components/shared/DocumentTitle';
import { ContentTypeListPage } from './ContentTypeList/ContentTypeListPage';

export function ContentTypesPage() {
  return (
    <>
      <DocumentTitle title="Content Model" />
      <ContentTypeListPage />
    </>
  );
}
