import {h} from 'ui/Framework';
import { clickLink as trackLinkClick } from 'analytics/events/DocsSidebar';
import $state from '$state';
import apis from './ApisSkeleton';
import createApiKeyAdvice from './CreateApiKeyAdvice';

export default function template ({ state: { spaceId, apiKeyId } }) {
  const apiKeyDetail = 'spaces.detail.api.keys.detail';
  const params = {apiKeyId};

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
      h('strong', {
        style: {
          display: 'block',
          marginBottom: '10px'
        }
      }, ['What‘s next?']),
      apiKeyId
        ? h('a.text-link', {
          onClick: (e) => {
            e.preventDefault();
            trackLinkClick($state.href(apiKeyDetail, params));
            $state.go(apiKeyDetail, params);
          }
        }, ['Download a code boilerplate'])
        : createApiKeyAdvice(spaceId)
    ])
  ]);
}
