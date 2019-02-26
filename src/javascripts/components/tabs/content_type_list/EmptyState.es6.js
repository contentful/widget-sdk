import React from 'react';
import PropTypes from 'prop-types';
import EmptyContentIcon from 'svg/empty-content-model.es6';
import { Button } from '@contentful/forma-36-react-components';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';

export default function EmptyState({ onCreate, shouldHide, shouldDisable }) {
  return (
    <div className="empty-state">
      <EmptyContentIcon />
      <div className="empty-state__title">Alright, let’s create your content model!</div>
      <div className="empty-state__description">
        The content model is comprised of content types. They work like a stencil which defines the
        structure of your content. Get started by creating your first content type.
      </div>
      <div className="empty-state__action">
        {!shouldHide && (
          <Button
            size="large"
            icon="PlusCircle"
            testId="create-content-type-empty-state"
            disabled={shouldDisable}
            onClick={onCreate}>
            Add content type
          </Button>
        )}
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

EmptyState.propTypes = {
  onCreate: PropTypes.func.isRequired,
  shouldHide: PropTypes.bool.isRequired,
  shouldDisable: PropTypes.bool.isRequired
};
