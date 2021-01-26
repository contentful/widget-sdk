import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { TextLink } from '@contentful/forma-36-react-components';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';

export const WebhookForbiddenPage = ({ templateId }) => {
  const fullUrl = `https://app.contentful.com/deeplink?link=webhook-template&id=${templateId}`;
  return (
    <ForbiddenPage
      data-test-id="webhooks.forbidden"
      message={
        <Fragment>
          Contact the administrator of this space to get access.
          <div>
            Share this with your admin and they can install it for you.
            <div>
              <TextLink href={fullUrl} target="_blank" rel="noopener noreferrer">
                {fullUrl}
              </TextLink>
            </div>
          </div>
        </Fragment>
      }
    />
  );
};

WebhookForbiddenPage.propTypes = {
  templateId: PropTypes.string.isRequired,
};
