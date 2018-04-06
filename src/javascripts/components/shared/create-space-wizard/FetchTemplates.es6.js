import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import RequestState from 'utils/RequestState';
import {getTemplatesList} from 'services/SpaceTemplateLoader';

const FetchTemplates = createReactClass({
  propTypes: {
    // children is a rendering function
    children: PropTypes.func.isRequired
  },
  getInitialState () {
    return {
      templates: [],
      requestState: RequestState.Pending()
    };
  },
  componentDidMount () {
    this.fetch();
  },
  render () {
    return this.props.children(this.state);
  },
  async fetch () {
    try {
      const templatesList = await getTemplatesList();
      this.setState({
        templates: parseTemplates(templatesList),
        requestState: RequestState.Success()
      });
    } catch (error) {
      this.setState({
        templates: [],
        requestState: RequestState.Error(error)
      });
    }
  }
});

function parseTemplates (templates = []) {
  return templates.map(({fields, sys}) => ({...fields, id: sys.id}));
}

export default FetchTemplates;
