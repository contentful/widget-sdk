import {h} from 'ui/Framework';
import { clickLink as trackLinkClick } from 'analytics/events/ContextualHelp';
import $state from '$state';
import apis from './ApisSkeleton';

export default function template ({ state: { apiKeyId } }) {
  const apiKeyDetail = 'spaces.detail.api.keys.detail';
  const params = {apiKeyId};

  return h('div', {
    style: {
      padding: '20px 30px'
    }
  }, [
    h('.contextual-help__line', [
      h('p', [
        'Contentful is ',
        h('strong', ['API focused']),
        '. You can use any of the following REST APIs. '
      ])
    ]),
    apis(),
    h('.contextual-help__line', [
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
        : h('p', ['Create an API access token by clicking “Add API key”'])
    ])
  ]);
}
