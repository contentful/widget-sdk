import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import EmptyContentTags from 'svg/illustrations/empty-content-tags.svg';
import { Button, Heading, Paragraph, Typography } from '@contentful/forma-36-react-components';
import React from 'react';
import PropTypes from 'prop-types';
import { TagType } from 'features/content-tags/core/TagType';

const NoTagsContainer = ({ onCreate, headline, body, buttonLabel }) => {
  return (
    <EmptyStateContainer>
      <EmptyContentTags className={defaultSVGStyle} />
      <Typography>
        <Heading>{headline}</Heading>
        <Paragraph>{body}</Paragraph>
        <Button buttonType="primary" onClick={() => onCreate(TagType.Default)}>
          {buttonLabel}
        </Button>
      </Typography>
    </EmptyStateContainer>
  );
};

NoTagsContainer.defaultProps = {
  headline: 'Organize your content with tags',
  body:
    'Group content with tags to make it easier to find what you need. You can filter for tags\n' +
    'across content types and use tags to improve your workflows.',
  buttonLabel: 'Add first tag',
};

NoTagsContainer.propTypes = {
  onCreate: PropTypes.func.isRequired,
  headline: PropTypes.string,
  body: PropTypes.string,
  buttonLabel: PropTypes.string,
};

export { NoTagsContainer };
