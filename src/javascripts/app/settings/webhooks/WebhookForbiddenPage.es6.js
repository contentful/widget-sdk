import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage.es6';

const WebhookForbiddenPage = ({ templateId }) => {
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
              <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                {fullUrl}
              </a>
            </div>
          </div>
        </Fragment>
      }
    />
  );
};
WebhookForbiddenPage.propTypes = {
  templateId: PropTypes.string.isRequired
};

export default WebhookForbiddenPage;
