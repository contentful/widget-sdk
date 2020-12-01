import {
  Button,
  Heading,
  Paragraph,
  Tooltip,
  Typography,
} from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import PropTypes from 'prop-types';
import React from 'react';
import EmptyContentTags from 'svg/illustrations/empty-content-tags.svg';
import { useCanManageTags } from '../hooks';
import { ConditionalWrapper } from './ConditionalWrapper';

const NoTagsContainer = ({ onCreate, headline, body, buttonLabel }) => {
  const canManageTags = useCanManageTags();
  return (
    <EmptyStateContainer>
      <EmptyContentTags className={defaultSVGStyle} />
      <Typography>
        <Heading>{headline}</Heading>
        <Paragraph>{body}</Paragraph>
        <ConditionalWrapper
          condition={!canManageTags}
          wrapper={(children) => (
            <Tooltip
              content={
                "You don't have permission to create new tags. Ask a space admin to give you permission."
              }
              id="admin-tip"
              place="top">
              {children}
            </Tooltip>
          )}>
          <Button buttonType="primary" onClick={onCreate} disabled={!canManageTags}>
            {buttonLabel}
          </Button>
        </ConditionalWrapper>
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
