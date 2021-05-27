import { ContentTypesPage } from '../list/ContentTypesPage';
import { ContentTypePageContainer } from '../editor/ContentTypePageContainer';
import {
  CustomRouter,
  Route,
  RouteErrorBoundary,
  RouteNavigate,
  Routes,
  useParams,
} from 'core/react-routing';
import StateRedirect from 'app/common/StateRedirect';
import React from 'react';
import { TABS } from '../editor/EditorFieldTabs';

function RedirectToTab() {
  const { contentTypeId } = useParams();
  return (
    <RouteNavigate route={{ path: 'content_types.detail', contentTypeId, tab: TABS.fields }} />
  );
}

function ContentTypesRouter() {
  const [basename] = window.location.pathname.split('content_types');

  return (
    <CustomRouter splitter="content_types">
      <RouteErrorBoundary>
        <Routes basename={basename + 'content_types'}>
          <Route name="spaces.detail.content_types.list" path="/" element={<ContentTypesPage />} />
          {/* "key" is required to fully unmount the component between "new"/":id" route changes */}
          <Route
            name="spaces.detail.content_types.new"
            path="/new/:tab"
            element={<ContentTypePageContainer isNew={true} key="new" />}
          />
          <Route
            name="spaces.detail.content_types.detail"
            path="/:contentTypeId/:tab"
            element={<ContentTypePageContainer isNew={false} key="existing" />}
          />
          <Route
            name="spaces.detail.content_types.detail"
            path="/:contentTypeId"
            element={<RedirectToTab />}
          />
          <Route name={null} path="*" element={<StateRedirect path="home" />} />
        </Routes>
      </RouteErrorBoundary>
    </CustomRouter>
  );
}

export const contentTypesState = {
  name: 'content_types',
  url: '/content_types{pathname:any}',
  component: ContentTypesRouter,
};
