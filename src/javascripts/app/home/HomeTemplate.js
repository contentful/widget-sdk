import { h } from 'utils/legacy-html-hyperscript';

export default function template() {
  return h('react-component', {
    name: 'app/home/SpaceHomePage',
    props:
      '{spaceTemplateCreated: spaceTemplateCreated, lastUsedOrg: lastUsedOrg, orgOwnerOrAdmin: orgOwnerOrAdmin}'
  });
}
