import { h } from 'utils/legacy-html-hyperscript/index.es6';

export default function template() {
  return h('react-component', {
    name: 'app/home/SpaceHomePage.es6',
    props:
      '{spaceTemplateCreated: spaceTemplateCreated, lastUsedOrg: lastUsedOrg, orgOwnerOrAdmin: orgOwnerOrAdmin}'
  });
}
