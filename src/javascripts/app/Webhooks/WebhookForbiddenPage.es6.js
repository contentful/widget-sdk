import React from 'react';
import PropTypes from 'prop-types';
import ForbiddenPage from '../../ui/Pages/Forbidden/ForbiddenPage';

const WebhookForbiddenPage = ({ templateId }) => {
  const messages = ['Contact the administrator of this space to get access.'];

  if (templateId) {
    const fullUrl = `https://app.contentful.com/deeplink?link=webhook-template&id=${templateId}`;
    messages.push(
      <div>
        Share this with your admin and they can install it for you.
        <div>
          <a href={fullUrl} target="_blank" rel="noopener noreferrer">
            {fullUrl}
          </a>
        </div>
      </div>
    );
  }
  return <ForbiddenPage data-test-id="webhooks.forbidden" message={messages} />;
};
WebhookForbiddenPage.propTypes = {
  templateId: PropTypes.string
};

export default WebhookForbiddenPage;
