import React from 'react';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';

export const WhatIsContentPreview = () => {
  return (
    <React.Fragment>
      <h2 className="entity-sidebar__heading">What‘s content preview?</h2>
      <p>
        Adding a content preview generates a link in the entry editor, referring to your custom
        preview environment.
      </p>
      <p>
        <KnowledgeBase target="content_preview" text="Read the guide" inlineText /> before setting
        up a custom content preview.
      </p>
    </React.Fragment>
  );
};
