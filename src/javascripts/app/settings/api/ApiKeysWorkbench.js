import React from 'react';
import PropTypes from 'prop-types';
import DocumentTitle from 'components/shared/DocumentTitle';
import { Heading, Workbench } from '@contentful/forma-36-react-components';
import NavigationIcon from 'ui/Components/NavigationIcon';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';

export default function ApiKeyWorkbench(props) {
  return (
    <React.Fragment>
      <DocumentTitle title="APIs" />
      <Workbench>
        <Workbench.Header
          icon={<NavigationIcon icon="apis" color="green" size="large" />}
          title={
            <>
              <Heading>APIs</Heading>
              <div className="workbench-header__kb-link">
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

ApiKeyWorkbench.propTypes = {
  sidebar: PropTypes.any,
  actions: PropTypes.any
};
