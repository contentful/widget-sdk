import {h} from 'ui/Framework';
import {find, omit} from 'lodash';
import {byName as Colors} from 'Styles/Colors';
import {assign} from 'utils/Collections';
import marked from 'libs/marked';

export default function (props) {
  selectBoilerplate(props.boilerplates[0].id);

  function selectBoilerplate (selectedId) {
    const nextProps = assign({selectedId, selectBoilerplate}, omit(props, ['connect']));
    const component = renderBoilerplate(nextProps);
    props.connect(component);
  }
}

function renderBoilerplate ({
  selectedId,
  boilerplates,
  selectBoilerplate,
  spaceId,
  deliveryToken,
  track
}) {
  const selected = find(boilerplates, {id: selectedId});

  return h('div', {
    style: {
      color: Colors.textMid,
      backgroundColor: Colors.iceMid,
      border: `1px solid ${Colors.iceDark}`,
      padding: '0.75em 2em',
      marginBottom: '4em'
    }
  }, [
    h('h4.h-reset', ['Getting started']),
    h('p', ['Prototype faster with boilerplate code as a base.']),
    h('label', {
      style: {
        display: 'block',
        marginBottom: '0.375em'
      }
    }, [
      'Select your language'
    ]),

    h('select.cfnext-select-box', {
      style: {display: 'block', width: '100%'},
      value: selectedId,
      onChange: e => {
        const id = e.target.value;
        const next = find(boilerplates, {id});
        if (next) {
          track.select(next.platform);
        }
        selectBoilerplate(id);
      }
    }, boilerplates.map(bp => {
      return h('option', {value: bp.id}, [bp.name]);
    })),

    h('a.btn-action.x--block', {
      style: {margin: '0.75em 0'},
      href: selected.sourceUrl(spaceId, deliveryToken),
      onClick: () => track.download(selected.platform)
    }, [
      'Download boilerplate .zip'
    ]),

    h('h4.h-reset', {style: {marginTop: '1.5em'}}, ['Run locally']),
    h('div.api-key-boilerplate-instructions', {
      style: {overflowWrap: 'break-word'},
      dangerouslySetInnerHTML: {__html: marked(selected.instructions)}
    })
  ]);
}
