import React from 'react';
import { css } from 'emotion';
import StateLink from 'app/common/StateLink.es6';
import PropTypes from 'prop-types';
import tokens from '@contentful/forma-36-tokens';
import { Tabs, Tab } from '@contentful/forma-36-react-components';

const styles = {
  editorFieldTabs: css({
    marginBottom: tokens.spacingL
  })
};

export default function EditorFieldTabs(props) {
  return (
    <div className={styles.editorFieldTabs}>
      <Tabs role="navigation" withDivider>
        <StateLink to="^.fields">
          {({ getHref }) => (
            <Tab id="fields" href={getHref()} selected={props.currentTab === 'fields'}>
              Fields
              {props.fieldsCount > 0 ? ` (${props.fieldsCount})` : ''}
            </Tab>
          )}
        </StateLink>
        <StateLink to="^.preview">
          {({ getHref }) => (
            <Tab id="preview" selected={props.currentTab === 'preview'} href={getHref()}>
              JSON preview
            </Tab>
          )}
        </StateLink>
        {props.hasAdvancedExtensibility && (
          <StateLink to="^.sidebar_configuration">
            {({ getHref }) => (
              <Tab
                id="sidebar_configuration"
                selected={props.currentTab === 'sidebar_configuration'}
                href={getHref()}
                testId="sidebar-config-tab">
                Sidebar
              </Tab>
            )}
          </StateLink>
        )}
      </Tabs>
    </div>
  );
}

EditorFieldTabs.propTypes = {
  currentTab: PropTypes.string.isRequired,
  fieldsCount: PropTypes.number.isRequired,
  hasAdvancedExtensibility: PropTypes.bool.isRequired
};
