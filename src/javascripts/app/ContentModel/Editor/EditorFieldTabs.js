import React from 'react';
import { css } from 'emotion';
import { go } from 'states/Navigator';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { Tabs, Tab, Tag } from '@contentful/forma-36-react-components';

const styles = {
  editorFieldTabs: css({
    marginBottom: tokens.spacingL,
  }),
  promotionTag: css({
    padding: '3px 5px',
    fontSize: '10px',
    lineHeight: '10px',
    letterSpacing: '0.5px',
    fontWeight: tokens.fontWeightMedium,
    borderRadius: '3px',
    backgroundColor: tokens.colorBlueDark,
    marginLeft: tokens.spacingXs,
    color: `${tokens.colorWhite} !important`,
    textTransform: 'uppercase',
  }),
  tabWithTag: css({
    alignItems: 'center',
    display: 'flex',
    textAlign: 'center',
  }),
};

export default function EditorFieldTabs(props) {
  return (
    <div className={styles.editorFieldTabs}>
      <Tabs withDivider>
        <Tab
          id="fields"
          onSelect={() => {
            go({ path: '^.fields' });
          }}
          selected={props.currentTab === 'fields'}>
          Fields
          {props.fieldsCount > 0 ? ` (${props.fieldsCount})` : ''}
        </Tab>
        <Tab
          id="preview"
          selected={props.currentTab === 'preview'}
          onSelect={() => {
            go({ path: '^.preview' });
          }}>
          JSON preview
        </Tab>
        {props.hasAdvancedExtensibility && (
          <Tab
            id="sidebar_configuration"
            selected={props.currentTab === 'sidebar_configuration'}
            onSelect={() => {
              go({ path: '^.sidebar_configuration' });
            }}
            testId="sidebar-config-tab">
            Sidebar
          </Tab>
        )}
        {props.hasAdvancedExtensibility && (
          <Tab
            id="entry_editor_configuration"
            selected={props.currentTab === 'entry_editor_configuration'}
            onSelect={() => {
              go({ path: '^.entry_editor_configuration' });
            }}
            className={styles.tabWithTag}
            testId="entry-editor-config-tab">
            Entry editors
            <Tag className={styles.promotionTag}>new</Tag>
          </Tab>
        )}
      </Tabs>
    </div>
  );
}

EditorFieldTabs.propTypes = {
  currentTab: PropTypes.string.isRequired,
  fieldsCount: PropTypes.number.isRequired,
  hasAdvancedExtensibility: PropTypes.bool.isRequired,
};
