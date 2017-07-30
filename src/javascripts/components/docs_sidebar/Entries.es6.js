import {h} from 'ui/Framework';

export default function template () {
  return h('div', [
    h('h3', {style: 'color:#bd19ce;'}, ['Entries. Entries! Entries!!!!!!']),
    h('.docs-sidebar__line', ['Entries are your content.']),
    h('hr'),
    h('.docs-sidebar__line', [
      h('strong', {style: 'color: #3eab59;'}, ['Get them all'])
    ]),
    h('.docs-sidebar__line', ['You can fetch all of your entries in this space like this:']),
    h('code.docs-sidebar__line', [
      'curl https://cdn.contentful.com/spaces/{{spaceContext.getId()}}/entries?access_token=SUPERTOKENHERENOW'
    ]),
    h('hr'),
    h('.docs-sidebar__line', [
      h('strong', {style: 'color: #3eab59;'}, ['Get just the ninjas'])
    ]),
    h('.docs-sidebar__line', ['Or, just the entries of the ', h('strong', ['ninja']), ' type:']),
    h('code.docs-sidebar__line', [
      'curl https://cdn.contentful.com/spaces/{{spaceContext.getId()}}/entries?content_type=ninjas&access_token=SUPERTOKENHERENOW'
    ]),
    h('hr'),
    h('.docs-sidebar__line', [
      'There are many other queries you can do. Read more about ',
      h('strong', ['entries']),
      ' in our ',
      h('a', {
        href: 'https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/entries',
        target: '_blank'
      }, ['developer docs']),
      '.'
    ])
  ]);
}
