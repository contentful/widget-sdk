import { ContentTypesPage } from 'components/tabs/content_type_list/ContentTypesPage';
import ContentTypePageContainer from 'app/ContentModel/Editor/ContentTypePageContainer';

const list = {
  name: 'list',
  url: '',
  component: ContentTypesPage,
};

const fields = {
  name: 'fields',
  url: '/fields',
  params: {
    ignoreLeaveConfirmation: true,
  },
};

const preview = {
  name: 'preview',
  url: '/preview',
  params: {
    ignoreLeaveConfirmation: true,
  },
};

const sidebarConfiguration = {
  name: 'sidebar_configuration',
  url: '/sidebar_configuration',
  params: {
    ignoreLeaveConfirmation: true,
  },
};

const entryEditorConfiguration = {
  name: 'entry_editor_configuration',
  url: '/entry_editor_configuration',
  params: {
    ignoreLeaveConfirmation: true,
  },
};

const newState = editorBase(
  {
    name: 'new',
    url: '_new',
  },
  true
);

const detail = editorBase(
  {
    name: 'detail',
    url: '/:contentTypeId',
  },
  false
);

export default {
  name: 'content_types',
  url: '/content_types',
  abstract: true,
  children: [list, newState, detail],
};

function editorBase(options) {
  return {
    redirectTo: '.fields',
    children: [fields, preview, sidebarConfiguration, entryEditorConfiguration],
    component: ContentTypePageContainer,
    ...options,
  };
}
