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
        'Contentful is ',
        h('strong', ['API focused']),
        '. You can use any of the following REST APIs. '
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
