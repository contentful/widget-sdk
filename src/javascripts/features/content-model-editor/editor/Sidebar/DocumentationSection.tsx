import React from 'react';
import { Paragraph, Subheading, Typography } from '@contentful/forma-36-react-components';
import KnowledgeBase, {
  KnowledgeBaseItems,
} from 'components/shared/knowledge_base_icon/KnowledgeBase';

export function DocumentationSection() {
  return (
    <React.Fragment>
      <Subheading className="entity-sidebar__heading">Documentation</Subheading>
      <Typography>
        <Paragraph>
          Read more about content types in our{' '}
          <KnowledgeBase
            target={KnowledgeBaseItems.content_modelling_basics}
            text="guide to content modelling"
          />
          .
        </Paragraph>
        <Paragraph>
          To learn more about the various ways of disabling and deleting fields have a look at the{' '}
          <KnowledgeBase target={KnowledgeBaseItems.field_lifecycle} text="field lifecycle" />.
        </Paragraph>
      </Typography>
    </React.Fragment>
  );
}