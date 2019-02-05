import SidebarWidgetTypes from '../SidebarWidgetTypes.es6';
import { WidgetTypes } from './constants.es6';

const Publication = {
  id: SidebarWidgetTypes.PUBLICATION,
  type: WidgetTypes.builtin,
  title: 'Publish & Status',
  description: 'Built-in - View entry status, publish, etc.'
};

const ContentPreview = {
  id: SidebarWidgetTypes.CONTENT_PREVIEW,
  type: WidgetTypes.builtin,
  title: 'Preview',
  description: 'Built-in - Displays preview functionality.'
};

const Links = {
  id: SidebarWidgetTypes.INCOMING_LINKS,
  type: WidgetTypes.builtin,
  title: 'Links',
  description: 'Built-in - Shows where an entry is linked.'
};

const Translation = {
  id: SidebarWidgetTypes.TRANSLATION,
  type: WidgetTypes.builtin,
  title: 'Translation',
  description: 'Built-in - Manage which translations are visible.'
};

const Versions = {
  id: SidebarWidgetTypes.VERSIONS,
  type: WidgetTypes.builtin,
  title: 'Versions',
  description: 'Built-in - View previously published versions.'
};

const Users = {
  id: SidebarWidgetTypes.USERS,
  type: WidgetTypes.builtin,
  title: 'Users',
  description: 'Built-in - Displays users on the same entry.'
};

export const EntryConfiguration = [
  Publication,
  ContentPreview,
  Links,
  Translation,
  Versions,
  Users
];

export const AssetConfiguration = [Publication, Links, Translation, Users];
