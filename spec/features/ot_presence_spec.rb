require 'spec_helper'

feature 'OT Presence', js: true do
  include ContentTypeHelper
  include EditorHelper

  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  scenario 'Presence notification is triggered when field is focused' do
    create_content_type 'Text'
    add_button 'Entry with Text'
    wait_for_sharejs
    page.execute_script("$('[ot-field-presence]').controller('otDocPresence').focus = function(){window.triggered = true}")

    edit_field('textField', 'en-US', 'textarea').set 'Foo'
    expect(page.evaluate_script('window.triggered')).to be
  end

end

