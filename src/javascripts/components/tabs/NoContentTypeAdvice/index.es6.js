import React from 'react';
import PropTypes from 'prop-types';
import Advice from 'components/tabs/Advice/index.es6';
import EmptyContentIcon from 'svg/empty-content-model.es6';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase.es6';
import CreateContentTypeCta from 'components/tabs/CreateContentTypeCta/index.es6';

export default function NoContentTypeAdvice({
  title = 'Alright, let’s create your content model!'
}) {
  return (
    <Advice data-test-id="no-content-type-advice">
      <Advice.Icon>
        <EmptyContentIcon />
      </Advice.Icon>
      <Advice.Title>{title}</Advice.Title>
      <Advice.Description>
        The content model is comprised of content types. They work like a stencil which defines the
        structure of your content. Get started by creating your first content type.
      </Advice.Description>

      <Advice.Action>
        <CreateContentTypeCta size="large" testId="create-content-type-empty-state" />
      </Advice.Action>
      <Advice.AdditionalInfo>
        No clue what purpose the content model serves? Read our documentation on{' '}
        <KnowledgeBase
          target="content_model"
          text="content modeling"
          inlineText="true"
          cssClass="text-link--standard"
        />
        .
      </Advice.AdditionalInfo>
    </Advice>
  );
}

NoContentTypeAdvice.propTypes = {
  title: PropTypes.string
};
