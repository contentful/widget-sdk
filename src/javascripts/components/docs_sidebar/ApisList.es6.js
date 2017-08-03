import {h} from 'ui/Framework';
import { clickLink as trackLinkClick } from 'analytics/events/DocsSidebar';
import { domain } from 'Config';
import apis from './ApisSkeleton';
import createApiKeyAdvice from './CreateApiKeyAdvice';

export default function template ({ state: { spaceId, apiKeyId } }) {
  const apiKeyLink = `https://app.${domain}/spaces/${spaceId}/api/keys/${apiKeyId}`;

  return h('div', {
    style: {
      padding: '20px 30px'
    }
  }, [
    h('.docs-sidebar__line', [
      h('p', [
        'Contentful is an ',
        h('strong', ['API focused']),
        ', content management system. So you can use any of the ',
        'four REST APIs to work with your content.'
      ])
    ]),
    apis(),
    h('.docs-sidebar__line', [
      h('strong', ['What‘s next?']),
      apiKeyId
        ? h('a.text-link', {
          href: apiKeyLink,
          style: {
            display: 'block',
            marginTop: '10px'
          },
          onClick: () => trackLinkClick(apiKeyLink)
        }, ['Download a code boilerplate'])
        : createApiKeyAdvice(spaceId)
    ])
  ]);
}
