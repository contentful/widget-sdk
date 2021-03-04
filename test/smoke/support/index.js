import '@testing-library/cypress/add-commands';

// set a custom test id
import { configure } from '@testing-library/cypress';
configure({ testIdAttribute: 'data-test-id' });
