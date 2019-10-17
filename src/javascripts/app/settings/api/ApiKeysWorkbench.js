import React from 'react';
import PropTypes from 'prop-types';
import DocumentTitle from 'components/shared/DocumentTitle.es6';
import { Heading } from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import Icon from 'ui/Components/Icon.es6';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';

export default function ApiKeyWorkbench(props) {
  return (
    <React.Fragment>
      <DocumentTitle title="APIs" />
      <Workbench>
        <Workbench.Header
          icon={<Icon name="page-apis" scale="0.8" />}
          title={
            <>
              <Heading>APIs</Heading>
              <div className="workbench-header__kb-link">
                <KnowledgeBase target="api_key" />
              </div>
            </>
          }
        />
        <Workbench.Content type="full">{props.children}</Workbench.Content>
        <Workbench.Sidebar position="right">{props.sidebar}</Workbench.Sidebar>
      </Workbench>
    </React.Fragment>
  );
}

ApiKeyWorkbench.propTypes = {
  sidebar: PropTypes.any
};
