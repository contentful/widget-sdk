import {h} from 'ui/Framework';
import clickToCopy from './InputWithCopy';
import { byName as colorByName } from 'Styles/Colors';
import { clickLink as trackLinkClick } from 'analytics/events/DocsSidebar';
import { domain } from 'Config';
import $state from '$state';
import createApiKeyAdvice from './CreateApiKeyAdvice';

export default function template (data) {
  const otherQueriesLink = 'https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/entries';
  const contentTypesList = 'spaces.detail.content_types.list';

  return h('div', {
    style: {
      padding: '20px 30px'
    }
  }, [
    h('.docs-sidebar__line', [
      h('p', ['These are your ', h('strong', ['entries']), ', where you create and manage your written content.'])
    ]),
    h('.docs-sidebar__line', [
      h('p', ['Each entry’s fields are defined by the way you customize the fields in your content types'])
    ]),
    h('.docs-sidebar__line', [
      h('strong', [`Fetch entries for "${data.state.contentType.name}" content type:`]),
      data.state.apiKeyId ? clickToCopy(curl(data), data.actions.render) : createApiKeyAdvice(data.state.spaceId),
      h('p', [
        'There are also ',
        h('a.text-link', {
          href: otherQueriesLink,
          target: '_blank',
          onClick: () => trackLinkClick(otherQueriesLink)
        }, ['other queries']),
        ' that you can perform on an entry.'
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
          trackLinkClick($state.href(contentTypesList));
          $state.go(contentTypesList);
        }
      }, ['Play with your content types'])
    ])
  ]);
}

function curl (data) {
  const colorBlue = colorize(colorByName.blueDarkest);
  const colorGreen = colorize(colorByName.greenDarkest);

  return {
    children: [
      h('pre', {
        style: {
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          color: colorByName.textMid
        }
      }, [
        h('span', [`curl https://cdn.${domain}/`]),
        h('span', colorBlue, ['spaces']),
        h('span', ['/']),
        h('span', colorGreen, [`${data.state.spaceId}`]),
        h('span', ['/']),
        h('span', colorBlue, ['entries']),
        h('span', ['?']),
        h('span', colorBlue, ['access_token']),
        h('span', ['=']),
        h('span', colorGreen, [`${data.state.token}`]),
        h('span', ['&']),
        h('span', colorBlue, ['content_type']),
        h('span', ['=']),
        h('span', colorGreen, [`${data.state.contentType.id}`])
      ])
    ],
    text: `curl 'https://cdn.${domain}/spaces/${data.state.spaceId}/entries?access_token=${data.state.token}&content_type=${data.state.contentType.id}'`,
    id: 'entriesCurl'
  };

  function colorize (color) {
    return {
      style: {
        color: `${color}`
      }
    };
  }
}
