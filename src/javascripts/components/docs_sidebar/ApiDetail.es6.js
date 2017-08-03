import {h} from 'ui/Framework';
import apis from './ApisSkeleton';
import createApiKeyAdvice from './CreateApiKeyAdvice';

export default function template ({ state: { spaceId, apiKeyId } }) {
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
        ? h('p', ['Download a boilerplate project for a language of your choice on this page.'])
        : createApiKeyAdvice(spaceId)
    ])
  ]);
}
