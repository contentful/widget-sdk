Error.stackTraceLimit = 1000;

/**
 * Subscribe to promise rejection and expose error details to karma runner.
 * Note that it will fail with generic error rather than a failed test case
 * due to asynchronous event handling.
 */
window.addEventListener('unhandledrejection', (ev) => {
  window.__karma__.error(`Unhandled rejection: ${ev.reason.stack}`);
});

// We import all these modules which have side effects.
// They may register Angular services, register test suite hooks or define
// global variables
/* eslint-disable import/first */
import 'npm:angular-mocks';
import { configure } from 'libs/enzyme';
import Adapter from 'libs/enzyme-adapter-react-16';
import './application';
import './boot';
import './contentful_mocks';
import './deep_diff';
import './dsl';
import './helpers';
import './hooks';
import './matchers';
import './sinon';
import './timing-reporter';
import './mocks/cf_stub';
import './mocks/client';
import './mocks/editor_context';
import './mocks/EditorDataLoader';
import './mocks/entity_editor_document';
import './mocks/locale_store';
import './mocks/ot_doc';
import './mocks/space_context';
import './mocks/the_store';
import './mocks/timing';
import './mocks/widget_api';

import installTestCaseContext from './TestCaseContext';
installTestCaseContext();

configure({ adapter: new Adapter() });
