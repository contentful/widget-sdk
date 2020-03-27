import React from 'react';
import PropTypes from 'prop-types';
import { Heading, Paragraph, Button, Typography } from '@contentful/forma-36-react-components';
import EmptyStateContainer, {
  defaultSVGStyle,
} from 'components/EmptyStateContainer/EmptyStateContainer';
import Illustration from 'svg/illustrations/readonly-space-ill.svg';
import { supportUrl } from 'Config';

const ReadOnlySpaceHome = ({ isAdmin }) => {
  return (
    <EmptyStateContainer>
      <Illustration className={defaultSVGStyle} />
      <Typography>
        <Heading>You’re viewing a read-only space</Heading>
        <Paragraph>
          All of your existing content is saved, but you canʼt create or edit anything.{' '}
          {isAdmin
            ? 'Get in touch with us to continue work.'
            : 'Weʼve informed your Contentful admin about it.'}
        </Paragraph>
      </Typography>
      {isAdmin && (
        <Button href={supportUrl} target="_blank">
          Talk to support
        </Button>
      )}
    </EmptyStateContainer>
  );
};

ReadOnlySpaceHome.propTypes = { isAdmin: PropTypes.bool.isRequired };

export default ReadOnlySpaceHome;
