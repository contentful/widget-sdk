import {h} from 'utils/hyperscript';
import * as Workbench from './Workbench';

export function template () {
  return Workbench.withoutSidebar([
    h('.loading-box--full-screen', {
      ngIf: '!contentTypes',
      style: { height: '100%' }
    }, [
      h('.loading-box__spinner'),
      h('.loading-box__message', [
        'Loading content model'
      ])
    ]),
    h('.entity-list', {ngIf: 'contentTypes.length'}, [
      h('cf-api-content-type', {ngRepeat: 'contentType in contentTypes track by contentType.getId()'})
    ]),
    h('p', {ngIf: 'contentTypes.length === 0'}, [
      'There are no content types yet'
    ])
  ].join(''));
}
