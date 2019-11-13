import React from 'react';
import { css, cx } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import StateLink from 'app/common/StateLink';
import PropTypes from 'prop-types';
import { Tabs, Tab } from '@contentful/forma-36-react-components';

const styles = {
  container: css({
    margin: `-${tokens.spacingL}`,
    marginBottom: tokens.spacingL,
    paddingLeft: tokens.spacingL,
    zIndex: 1,
    background: 'white'
  })
};

export default function ApiKeysNavigation(props) {
  return (
    <div className={cx('workbench-nav', styles.container)}>
      <Tabs role="navigation">
        <StateLink to="spaces.detail.api.keys.list">
          {({ getHref }) => (
            <Tab
              id="cda-tokens"
              href={getHref()}
              selected={props.currentTab === 'cda-tokens'}
              testId="api-keys-cda-tokens-tab">
              Content delivery / preview tokens
            </Tab>
          )}
        </StateLink>
        <StateLink to="spaces.detail.api.cma_tokens">
          {({ getHref }) => (
            <Tab
              id="cma-tokens"
              selected={props.currentTab === 'cma-tokens'}
              href={getHref()}
              testId="api-keys-cma-tokens-tab">
              Content management tokens
            </Tab>
          )}
        </StateLink>
      </Tabs>
    </div>
  );
}

ApiKeysNavigation.propTypes = {
  currentTab: PropTypes.oneOf(['cda-tokens', 'cma-tokens']).isRequired
};
