import React from 'react';
import PropTypes from 'prop-types';
import { Heading, Paragraph } from '@contentful/forma-36-react-components';
import { can, Action } from 'access_control/AccessChecker/index.es6';
import { getModule } from 'NgRegistry.es6';
import CreateEntryButton from 'components/CreateEntryButton/index.es6';
import FolderIllustration from 'svg/folder-illustration.es6';
import PenIllustration from 'svg/pen-illustration.es6';
import CoffeeCupIllustration from 'svg/coffee-cup-illustration.es6';
import EmptyStateContainer, {
  defaultSVGStyle
} from 'components/EmptyStateContainer/EmptyStateContainer.es6';
import NoContentTypeAdvice from 'components/tabs/NoContentTypeAdvice/index.es6';

const spaceContext = getModule('spaceContext');

export default ({ hasContentType, contentTypes, onCreate, suggestedContentTypeId }) => {
  const canCreateCT = can(Action.CREATE, 'ContentType');
  const userIsAdmin = spaceContext.getData('spaceMembership.admin', false);

  if (hasContentType) {
    return (
      <EmptyEntries
        contentTypes={contentTypes}
        onCreate={onCreate}
        suggestedContentTypeId={suggestedContentTypeId}
        userIsAdmin={userIsAdmin}
      />
    );
  } else if (!hasContentType && (userIsAdmin || canCreateCT)) {
    return <NoContentTypeAdvice />;
  } else if (!hasContentType && !(userIsAdmin || canCreateCT)) {
    return <EditorEmptyContentTypes />;
  }
};

const EmptyEntries = ({ contentTypes, onCreate, suggestedContentTypeId, userIsAdmin }) => (
  <EmptyStateContainer data-test-id="no-entries-advice">
    <div className={defaultSVGStyle}>
      {userIsAdmin ? <FolderIllustration /> : <PenIllustration />}
    </div>
    <Heading>Now for the fun part</Heading>
    <Paragraph>Add your content here. Start by creating your first entry.</Paragraph>
    <CreateEntryButton
      disabled={false}
      contentTypes={contentTypes}
      onSelect={onCreate}
      suggestedContentTypeId={suggestedContentTypeId}
    />
  </EmptyStateContainer>
);

EmptyEntries.propTypes = {
  onCreate: PropTypes.func.isRequired,
  contentTypes: PropTypes.array,
  suggestedContentTypeId: PropTypes.string,
  userIsAdmin: PropTypes.bool
};

const EditorEmptyContentTypes = () => (
  <EmptyStateContainer data-test-id="no-entries-advice">
    <div className={defaultSVGStyle}>
      <CoffeeCupIllustration />
    </div>
    <Heading>Time to get a coffee with your admin</Heading>
    <Paragraph>
      Looks like you need a content model. What’s a content model? Good question! A content model
      structures and organises your content. It’s made up of content types.
    </Paragraph>
  </EmptyStateContainer>
);
