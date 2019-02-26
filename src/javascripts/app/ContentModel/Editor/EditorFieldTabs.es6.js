import React from 'react';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import StateLink from 'app/common/StateLink.es6';
import PropTypes from 'prop-types';
import { Tabs, Tab } from '@contentful/forma-36-react-components';

const styles = {
  container: css({
    position: 'sticky',
    top: '0',
    paddingLeft: tokens.spacing2Xl,
    zIndex: 1,
    background: 'white'
  })
};

export default function EditorFieldTabs(props) {
  return (
    <div className={cx('workbench-nav', styles.container)}>
      <Tabs role="navigation">
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
        {props.hasCustomSidebarFeature && (
          <StateLink to="^.sidebar_configuration">
            {({ getHref }) => (
              <Tab
                id="sidebar_configuration"
                selected={props.currentTab === 'sidebar_configuration'}
                href={getHref()}>
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
  hasCustomSidebarFeature: PropTypes.bool.isRequired
};
