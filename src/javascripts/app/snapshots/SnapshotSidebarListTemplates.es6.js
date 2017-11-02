import {extend} from 'lodash';
import {h} from 'utils/hyperscript';

const styles = {
  table: {
    'width': '100%',
    'line-height': '1.5',
    // @todo get rhythm helpers from [stylesheets/mixins/typography.styl] for inline styles
    'margin': ' 0 0 1.28em'
  },
  cell: {
    'padding': '0.375em 0'
  },
  radio: {
    'vertical-align': 'baseline'
  },
  statusLabel: {
    'display': 'block',
    'text-transform': 'uppercase',
    'letter-spacing': '1px',
    'text-align': 'right',
    'font-size': '80%',
    'vertical-align': 'baseline'
  }
};

export function snapshotSidebarlist () {
  const compareHelpText = 'Select a previous version to compare it with the current version of this entry.';
  const noSnapshotsText = 'There are no previous versions because you haven\'t made changes to this entry yet. As soon as you publish changes, you\'ll be able to compare different versions.';

  return h('.snapshot-sidebar', { ariaLabel: 'snapshots-list' }, [
    errorMessage(),
    h('div', {ngShow: 'snapshots'}, [
      snapshotsList(),
      compareBtn(),
      note(compareHelpText)
    ]),
    h('div', {ngIf: '!snapshots && !isLoading'}, [note(noSnapshotsText)])
  ]);
}

function errorMessage () {
  return h('.snapshot-sidebar__warning', {ngIf: 'errorMessage'}, ['{{errorMessage}}']);
}

function note (text) {
  return h('p.entity-sidebar__help-text', {role: 'note'}, [text]);
}

function snapshotsList () {
  return h('table.entity-sidebar__help-text', {
    role: 'listbox',
    ariaMultiselectable: 'false',
    style: styles.table
  }, [
    h('tr', {ngRepeat: 'snapshot in snapshots'}, [
      h('td', {style: styles.cell}, [
        h('input.radio-editor__input', {
          role: 'option',
          ariaDisabled: '{{snapshot.sys.isCurrent}}',
          type: 'radio',
          name: 'selected',
          value: '{{snapshot.sys.id}}',
          style: styles.radio,
          ngDisabled: 'snapshot.sys.isCurrent',
          ngModel: '$parent.selectedId'})]),
      h('td', {style: extend({'width': '100%'}, styles.cell)}, [
        h('time.radio-editor__label', {
          datetime: '{{snapshot.sys.createdAt}}',
          cfRelativeDatetime: true})]),
      h('td', {style: styles.cell}, [
        h('span', {
          style: styles.statusLabel,
          class: '{{snapshotStatus.getClassname(snapshot)}}'
        }, ['{{snapshotStatus.getLabel(snapshot)}}'])])
    ])
  ]);
}


function compareBtn () {
  return h('button.btn-secondary-action.x--block', {
    role: 'button',
    ariaDisabled: '{{!selectedId}}',
    dataTestId: 'compare-versions',
    uiSref: '.compare.withCurrent({snapshotId: selectedId})',
    ngDisabled: '!selectedId'
  }, ['Compare with current version']);
}
