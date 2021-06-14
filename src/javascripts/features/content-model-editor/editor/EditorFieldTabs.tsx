import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Tab, Tabs } from '@contentful/forma-36-react-components';

export const TABS = {
  fields: 'fields',
  preview: 'preview',
  sidebarConfiguration: 'sidebar_configuration',
  entryEditorConfiguration: 'entry_editor_configuration',
};

const styles = {
  editorFieldTabs: css({
    marginBottom: tokens.spacingL,
  }),
  tabWithTag: css({
    alignItems: 'center',
    display: 'flex',
    textAlign: 'center',
  }),
};

type Props = {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  fieldsCount: number;
  hasAdvancedExtensibility: boolean;
};

export function EditorFieldTabs(props: Props) {
  return (
    <div className={styles.editorFieldTabs}>
      <Tabs withDivider>
        <Tab
          id="fields"
          onSelect={() => props.setCurrentTab(TABS.fields)}
          selected={props.currentTab === TABS.fields}>
          Fields
          {props.fieldsCount > 0 ? ` (${props.fieldsCount})` : ''}
        </Tab>
        <Tab
          id="preview"
          selected={props.currentTab === TABS.preview}
          onSelect={() => props.setCurrentTab(TABS.preview)}>
          JSON preview
        </Tab>
        {props.hasAdvancedExtensibility && (
          <Tab
            id="sidebar_configuration"
            selected={props.currentTab === TABS.sidebarConfiguration}
            onSelect={() => props.setCurrentTab(TABS.sidebarConfiguration)}
            testId="sidebar-config-tab">
            Sidebar
          </Tab>
        )}
        {props.hasAdvancedExtensibility && (
          <Tab
            id="entry_editor_configuration"
            selected={props.currentTab === TABS.entryEditorConfiguration}
            onSelect={() => props.setCurrentTab(TABS.entryEditorConfiguration)}
            className={styles.tabWithTag}
            testId="entry-editor-config-tab">
            Entry editors
          </Tab>
        )}
      </Tabs>
    </div>
  );
}
