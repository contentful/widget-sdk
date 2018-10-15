import connectToWidgetAPI from '../WidgetApi/index.es6';
import RichTextEditor from './RichTextEditor.es6';
import withFeatureFlag from './withFeatureFlag.es6';

export default withFeatureFlag(connectToWidgetAPI(RichTextEditor));
