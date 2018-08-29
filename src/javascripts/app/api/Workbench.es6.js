import { h } from 'utils/hyperscript';

export function withSidebar(content, sidebar) {
  return h('.workbench', [
    h('cf-api-key-nav'),
    h('.workbench-main', [
      h('.workbench-main__content', [content]),
      h('.workbench-main__sidebar', [h('.entity-sidebar', sidebar)])
    ])
  ]);
}

export function withoutSidebar(content) {
  return h('.workbench', [
    h('cf-api-key-nav'),
    h(
      '.workbench-main',
      {
        style: {
          display: 'block',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative'
        }
      },
      [content]
    )
  ]);
}
