import React from 'react';
import PropTypes from 'prop-types';
import ForbiddenPage from '../../ui/Pages/Forbidden/ForbiddenPage.es6';

const ExtensionsForbidden = ({ extensionUrl }) => {
  const messages = ['Contact the administrator of this space to get access.'];

  if (extensionUrl) {
    const fullUrl = `https://app.contentful.com/deeplink?link=install-extension&url=${encodeURI(
      extensionUrl
    )}`;
    messages.push(
      <div>
        Share this URL with your admin so they can install it for you.
        <div>
          <a href={fullUrl} target="_blank" rel="noopener noreferrer">
            {fullUrl}
          </a>
        </div>
      </div>
    );
  }
  return <ForbiddenPage data-test-id="extensions.forbidden" message={messages} />;
};
ExtensionsForbidden.propTypes = {
  extensionUrl: PropTypes.string
};

export default ExtensionsForbidden;
