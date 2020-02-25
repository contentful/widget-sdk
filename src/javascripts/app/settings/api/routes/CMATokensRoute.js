import React from 'react';
import { Paragraph, Typography, List, ListItem } from '@contentful/forma-36-react-components';
import ApiKeysWorkbench from '../ApiKeysWorkbench';
import ApiKeysNavigation from '../ApiKeysNavigation';
import WorkbenchSidebarItem from 'app/common/WorkbenchSidebarItem';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import { CMATokensView } from '../cma-tokens/CMATokensView';

export default function CMATokensRoute() {
  return (
    <ApiKeysWorkbench
      sidebar={
        <WorkbenchSidebarItem title="Documentation">
          <Typography>
            <Paragraph>
              The Content Management API, unlike the Content Delivery API, provides read and write
              access to your Contentful spaces. This enables integrating content management in your
              development workflow, perform automation operations…
            </Paragraph>
          </Typography>
          <List>
            <ListItem>
              <KnowledgeBase
                inlineText
                text="Content Management API reference"
                target="management_api"
              />
            </ListItem>
            <ListItem>
              <KnowledgeBase inlineText text="Other Contentful APIs" target="content_apis" />
            </ListItem>
          </List>
        </WorkbenchSidebarItem>
      }>
      <ApiKeysNavigation currentTab="cma-tokens" />
      <CMATokensView />
    </ApiKeysWorkbench>
  );
}
