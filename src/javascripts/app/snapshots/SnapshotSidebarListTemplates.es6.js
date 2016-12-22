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
  },
  moreButton: {
    'margin-top': '-1.28em'
  }
};

export function snapshotSidebarlist () {
  const compareHelpText = 'Select a previous version to compare it with the current version of this entry.';
  const noSnapshotsText = 'There are previous versions because you haven\'t made changes to this entry yet. As soon as you publish changes, you\'ll be able to compare different versions.';

  return h('.snapshot-sidebar', [
    errorMessage(),
    h('div', {ngShow: 'hasSnapshots'}, [
      snapshotsList(),
      loadMoreBtn(),
      compareBtn(),
      note(compareHelpText)
    ]),
    h('div', {ngIf: '!hasSnapshots && !isLoading'}, [note(noSnapshotsText)])
  ]);

}

function errorMessage () {
  return h('.snapshot-sidebar__warning', {ngIf: 'errorMessage'}, ['{{errorMessage}}']);
}

function note (text) {
  return h('p.entity-sidebar__help-text', {role: 'note'}, [text]);
}

function snapshotsList () {
  return h('table.snapshot-sidebar__list.entity-sidebar__help-text', {style: styles.table}, [
    h('tr.snapshot-sidebar__item', {ngRepeat: 'snapshot in snapshots'}, [
      h('td', {style: styles.cell}, [
        h('input.radio-editor__input', {
          style: styles.radio,
          type: 'radio',
          name: 'selected',
          value: '{{snapshot.sys.id}}',
          ngDisabled: 'snapshot.sys.isCurrent',
          ngModel: '$parent.selectedId'})]),
      h('td', {style: extend({'width': '100%'}, styles.cell)}, [
        h('time.radio-editor__label', {
          datetime: '{{ snapshot.sys.createdAt }}',
          cfRelativeDatetime: true})]),
      h('td', {style: styles.cell}, [
        h('span', {
          style: styles.statusLabel,
          class: '{{snapshotStatus.getClassname(snapshot)}}'
        }, ['{{ snapshotStatus.getLabel(snapshot) }}'])])
    ])
  ]);
}

function loadMoreBtn () {
  return h('button.snapshot-sidebar__load-more-btn.btn-plain.x--block', {
    style: styles.moreButton,
    role: 'button',
    ngShow: 'hasMore',
    ngClick: 'loadMore()',
    ngDisabled: 'isLoading',
    ngClass: '{"is-loading": isLoading}'
  }, ['Load more…']);
}

function compareBtn () {
  return h('button.snapshot-sidebar__compare-btn.btn-secondary-action.x--block', {
    role: 'button',
    uiSref: '.compare.withCurrent({snapshotId: selectedId})',
    ngDisabled: '!selectedId'
  }, ['Compare with current version']);
}
