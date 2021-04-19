import React from 'react';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import PropTypes from 'prop-types';
import DocumentTitle from 'components/shared/DocumentTitle';
import { Heading, Workbench } from '@contentful/forma-36-react-components';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';

const styles = {
  knowledgeBaseIcon: css({
    lineHeight: tokens.lineHeightXl,
    marginLeft: tokens.spacing2Xs,
    padding: `0 ${tokens.spacing2Xs}`,
    fontSize: tokens.fontSizeXl,
  }),
};

export function ApiKeysWorkbench(props) {
  return (
    <React.Fragment>
      <DocumentTitle title="APIs" />
      <Workbench>
        <Workbench.Header
          icon={<ProductIcon icon="Apis" size="large" />}
          title={
            <>
              <Heading>APIs</Heading>
              <div className={styles.knowledgeBaseIcon}>
                <KnowledgeBase target="api_key" />
              </div>
            </>
          }
          actions={props.actions}
        />
        <Workbench.Content type="full">{props.children}</Workbench.Content>
        <Workbench.Sidebar position="right">{props.sidebar}</Workbench.Sidebar>
      </Workbench>
    </React.Fragment>
  );
}

ApiKeysWorkbench.propTypes = {
  sidebar: PropTypes.any,
  actions: PropTypes.any,
};
