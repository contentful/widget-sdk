import {h} from 'ui/Framework';
import { clickLink as trackLinkClick } from 'analytics/events/DocsSidebar';
import { domain } from 'Config';
import $state from '$state';
import createApiKeyAdvice from './CreateApiKeyAdvice';
import curl from './Curl';

const otherQueriesLink = 'https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/content-types';
const apiKeyDetail = 'spaces.detail.api.keys.detail';

export default function template (data) {
  const params = {apiKeyId: data.state.apiKeyId};
  const contentTypesCurlUrl = `https://cdn.${domain}/spaces/${data.state.spaceId}/content_types/${data.state.contentType.id}?access_token=${data.state.token}`;

  return h('div', {
    style: {
      padding: '20px 30px'
    }
  }, [
    h('.docs-sidebar__line', [
      h('p', [
        'These are your ',
        h('strong', ['content types']),
        ', which are similar to schemas, and for each content type, ',
        'you can customize its fields and field properties.'
      ])
    ]),
    h('.docs-sidebar__line', [
      h('strong', [`Fetch the content type named '${data.state.contentType.name}'.`]),
      data.state.apiKeyId ? curl(contentTypesCurlUrl, 'contentTypesCurl', data.actions.render) : createApiKeyAdvice(data.state.spaceId),
      h('p', [
        'You can read about ',
        h('a.text-link', {
          href: otherQueriesLink,
          target: '_blank',
          onClick: () => trackLinkClick(otherQueriesLink)
        }, ['other content type queries']),
        '.'
      ])
    ]),
    h('.docs-sidebar__line', [
      h('strong', {
        style: {
          display: 'block',
          marginBottom: '10px'
        }
      }, ['What‘s next?']),
      h('a.text-link', {
        onClick: (e) => {
          e.preventDefault();
          trackLinkClick($state.href(apiKeyDetail, params));
          $state.go(apiKeyDetail, params);
        }
      }, ['Download a code boilerplate'])
    ])
  ]);
}
