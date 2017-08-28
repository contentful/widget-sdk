import { h } from 'ui/Framework';
import clickToCopy from './InputWithCopy';
import { byName as colorByName } from 'Styles/Colors';
import { flatten } from 'lodash';
import { copyToClipboard as trackCopyToClipboard } from 'analytics/events/ContextualHelp';
import { domain } from 'Config';


export default function ({ api = 'cdn', path, params, id }, render) {
  const hasParams = params.length;
  const query = params.map(([key, val]) => `${key}=${val}`);
  const url = `curl 'https://${api}.${domain}/${path.join('/')}${hasParams ? '?' + query.join('&') : '/'}'`;

  return clickToCopy({
    children: [makeCurl(api, path, params)],
    text: url,
    onCopy: _ => trackCopyToClipboard(id),
    id
  }, render);
}

function colorize (color) {
  return {
    style: {
      color: `${color}`
    }
  };
}

/**
 * curl({
 *   api: 'cdn',
 *   path: ['spaces', 'spaceID', 'entries', 'entryId']
 *   params: [['access_token', 'lkajsdlkajdlkhl'], ['content_type', 'alksjdsalksd']],
 *   id: 'entriesCurl'
 * }, render)
 */
function makeCurl (api, path, params) {
  const blue = colorize(colorByName.blueDarkest);
  const green = colorize(colorByName.greenDarkest);
  const colors = [blue, green];

  const host = h('span', [`curl https://${api}.${domain}/`]);
  const pathComponents = flatten(path.map((v, i) => [h('span', colors[i % 2], [v]), h('span', ['/'])]));
  const queryParams = flatten(params.map(([key, value]) => {
    return [
      h('span', blue, [key]),
      h('span', ['=']),
      h('span', green, [value]),
      h('span', ['&'])
    ];
  }));

  pathComponents.pop(); // get rid of trailing '/'
  queryParams.pop(); // get rid of trailing '&'

  return h('pre', {
    style: {
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      color: colorByName.textMid
    }
  }, [host].concat(pathComponents, h('span', ['?']), queryParams));
}
