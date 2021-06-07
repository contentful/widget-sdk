import React from 'react';
import { ContentTypesPage } from './ContentTypesPage';
import { useParams, useRouteNavigate } from 'core/react-routing';

export const ContentTypePageContainer = ({ isNew }: { isNew: boolean }) => {
  const { contentTypeId, tab } = useParams();
  const navigate = useRouteNavigate();
  const setCurrentTab = (tab: string) =>
    navigate(
      isNew
        ? { path: 'content_types.new', tab }
        : { path: 'content_types.detail', contentTypeId, tab },
      { replace: true, state: { ignoreLeaveConfirmation: true } }
    );

  return (
    <ContentTypesPage
      currentTab={tab}
      setCurrentTab={setCurrentTab}
      contentTypeId={contentTypeId}
      isNew={isNew}
    />
  );
};
