import {h} from 'ui/Framework';
import $state from '$state';
import { clickLink as trackLinkClick } from 'analytics/events/ContextualHelp';

export default function () {
  const apiKeyList = 'spaces.detail.api.keys.list';

  return h('.contextual-help__line', {
    style: {
      marginTop: '10px'
    }
  }, [
    h('p', ['It looks like you don‘t have any API access tokens.']),
    h('p', ['To be able to perform any queries, you‘ll need to generate one.']),
    h('a.text-link', {
      style: {
        display: 'block'
      },
      onClick: (e) => {
        e.preventDefault();
        trackLinkClick($state.href(apiKeyList));
        $state.go(apiKeyList);
      }
    }, ['Create API access tokens'])
  ]);
}
