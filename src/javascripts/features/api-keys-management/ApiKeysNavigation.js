import React from 'react';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import { go } from 'states/Navigator';
import { Tabs, Tab } from '@contentful/forma-36-react-components';

const styles = {
  container: css({
    margin: `-${tokens.spacingL}`,
    marginBottom: tokens.spacingL,
    paddingLeft: tokens.spacingL,
    zIndex: 1,
    background: 'white',
  }),
};

export function ApiKeysNavigation(props) {
  return (
    <div className={cx('workbench-nav', styles.container)}>
      <Tabs>
        <Tab
          id="cda-tokens"
          onSelect={() => {
            go({ path: 'spaces.detail.api.keys.list' });
          }}
          selected={props.currentTab === 'cda-tokens'}
          testId="api-keys-cda-tokens-tab">
          Content delivery / preview tokens
        </Tab>

        <Tab
          id="cma-tokens"
          selected={props.currentTab === 'cma-tokens'}
          onSelect={() => {
            go({ path: 'spaces.detail.api.cma_tokens' });
          }}
          testId="api-keys-cma-tokens-tab">
          Content management tokens
        </Tab>
      </Tabs>
    </div>
  );
}

ApiKeysNavigation.propTypes = {
  currentTab: PropTypes.oneOf(['cda-tokens', 'cma-tokens']).isRequired,
};
