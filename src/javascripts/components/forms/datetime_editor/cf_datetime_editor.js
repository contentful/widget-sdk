import tokens from '@contentful/forma-36-tokens';
import { h } from 'utils/legacy-html-hyperscript';

export default function template() {
  return h('span', null, [
    renderDateControl(),
    renderTimeSection(),
    renderValidationIcon({
      ngIf: 'dateInvalid',
      tooltip: 'You must provide a valid date'
    }),
    renderValidationIcon({
      ngIf: 'timeInvalid',
      tooltip: 'Time must be of format {{maxTime}}.999'
    })
  ]);
}

function renderValidationIcon({ ngIf, tooltip }) {
  const style = {
    position: 'relative',
    top: '3px',
    fontSize: '14px',
    color: tokens.colorRedLight
  };

  // This component lives in `cfValidationDateSelectDirective`
  return h('react-component', {
    ngIf: `${ngIf} && validationIconComponent`,
    style,
    component: 'validationIconComponent',
    props: `{ content: "${tooltip}" }`
  });
}

function renderDateControl() {
  return h('span', null, [
    h('input.form-control.date', {
      type: 'text',
      ngDisabled: '!enabled',
      ngModel: 'localDate'
    }),
    h('i.fa.fa-calendar', {
      style: {
        cursor: 'pointer'
      },
      ngClick: 'handleCalendarIconClick($event)'
    })
  ]);
}

function renderTimeSection() {
  return h('span', { ngShow: 'hasTime' }, [
    h('input.form-control.time', {
      type: 'text',
      ngDisabled: '!enabled',
      ngModel: 'localTime',
      placeholder: 'eg. {{maxTime}}'
    }),
    h('i.fa.fa-clock-o'),
    h(
      'select.cfnext-select-box.ampm',
      {
        ngShow: 'widget.settings.ampm == "12"',
        ngModel: 'ampm'
      },
      [h('option', { value: 'am' }, ['AM']), h('option', { value: 'pm' }, ['PM'])]
    ),
    h(
      'select.cfnext-select-box.zone',
      {
        ngHide: '!localTime || !hasTimezone',
        ngDisabled: '!enabled',
        ngModel: 'tzOffset',
        ngOptions: "offset as ('UTC'+offset) for offset in timezones"
      },
      [h('option', { value: '' }, ['(None)'])]
    )
  ]);
}