import { entry } from '../utils/paths'
import { verifyLocation } from '../utils/verify-location'
import {
  verifySdkInstallationParameters,
  verifySdkInstanceParameters,
} from '../utils/verify-parameters'
import idsData from './fixtures/ids-data.json'
import contentTypeData from './fixtures/content-type-data/entry-editor-ext.json'

const post = {
  id: '5KnnZPwiIq1RNctf1Q1uNl',
  title: 'My post to test onValueChanged',
  body: 'body value',
}

const iframeSelector = '[data-test-id="cf-ui-workbench-content"] iframe'
const entryExtensionSelector = 'cf-ui-card'

context('Entry editor extension', () => {
  beforeEach(() => {
    cy.setupBrowserStorage()
    cy.visit(entry(post.id))
    cy.findByTestId('workbench-title').should(($title) => {
      expect($title).to.exist
    })

    cy.waitForIframeWithTestId(entryExtensionSelector)
    cy.get('[data-test-id="cf-ui-workbench-content"]').within(() => {
      cy.get('iframe').captureIFrameAs('extension')
    })
  })

  it('verifies that onValueChanged is called with the initial value and updates', () => {
    cy.getSdk(iframeSelector).then(async (sdk) => {
      const spy = cy.stub()
      sdk.entry.fields.body.onValueChanged(spy)
      expect(spy).to.be.calledOnce
      expect(spy).to.be.calledWith('body value')

      spy.reset()

      cy.get('@extension').within(() => {
        cy.findByTestId('body-field').should('exist').and('have.value', post.body)
        expect(spy).not.to.be.called
        cy.findByTestId('body-field')
          .type('updating')
          .then(() => {
            expect(spy).to.be.called
          })
      })
    })
  })
})
