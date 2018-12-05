import withWidgetApi from '../WidgetApi/index.es6';
import RichTextEditor from './RichTextEditor.es6';
import withFeatureFlag from './withFeatureFlag.es6';
import withTracking from 'app/widgets/rich_text/withTracking.es6';

export default withFeatureFlag(withWidgetApi(withTracking(RichTextEditor)));
