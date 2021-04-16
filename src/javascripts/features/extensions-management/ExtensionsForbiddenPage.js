import React from 'react';
import { TextLink } from '@contentful/forma-36-react-components';
import ForbiddenPage from 'ui/Pages/Forbidden/ForbiddenPage';
import { useNavigationState } from 'core/react-routing';

export const ExtensionsForbiddenPage = () => {
  const navigationState = useNavigationState();
  const extensionUrl = navigationState?.extensionUrl || '';

  if (!extensionUrl) {
    return <ForbiddenPage data-test-id="extensions.forbidden" />;
  }

  const messages = ['Contact the administrator of this space to get access.'];
  const fullUrl = `https://app.contentful.com/deeplink?link=install-extension&url=${encodeURI(
    extensionUrl
  )}`;
  messages.push(
    <div>
      Share this URL with your admin so they can install it for you.
      <div>
        <TextLink href={fullUrl} target="_blank" rel="noopener noreferrer">
          {fullUrl}
        </TextLink>
      </div>
    </div>
  );
  return <ForbiddenPage data-test-id="extensions.forbidden" message={messages} />;
};
