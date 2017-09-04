import {h} from 'ui/Framework';
import apis from './ApisSkeleton';
import createApiKeyAdvice from './CreateApiKeyAdvice';

export default function template ({ state: { spaceId, apiKeyId } }) {
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
        ? h('p', ['Download a boilerplate project for a language of your choice on this page.'])
        : createApiKeyAdvice(spaceId)
    ])
  ]);
}
