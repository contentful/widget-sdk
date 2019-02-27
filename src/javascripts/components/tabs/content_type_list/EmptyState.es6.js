import React from 'react';
import EmptyContentIcon from 'svg/empty-content-model.es6';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';
import CreateContentTypeCta from './CreateContentTypeCta.es6';

export default function EmptyState() {
  return (
    <div className="empty-state">
      <EmptyContentIcon />
      <div className="empty-state__title">Alright, let’s create your content model!</div>
      <div className="empty-state__description">
        The content model is comprised of content types. They work like a stencil which defines the
        structure of your content. Get started by creating your first content type.
      </div>
      <div className="empty-state__action">
        <CreateContentTypeCta size="large" />
      </div>
      <div className="empty-state__additional">
        No clue what purpose the content model serves? Read our documentation on{' '}
        <KnowledgeBase
          target="content_model"
          text="content modeling"
          inlineText="true"
          cssClass="text-link--standard"
        />
        .
      </div>
    </div>
  );
}
