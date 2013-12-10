require 'spec_helper'

feature 'Entry Editor', js: true, sauce: true do
  include ContentTypeHelper
  include EditorHelper

  before do
    ensure_login
    remove_test_space
    create_test_space
    create_content_type 'Text'
  end

  after do
    remove_test_space
  end

  scenario 'Playing with the tab actions' do
    add_button 'Entry with Text'
    edit_field('textField', 'en-US', 'textarea').set 'Foo'
    click_button 'Publish'
    expect_success 'published successfully'
    click_button 'Unpublish'
    expect_success 'unpublished successfully'
    click_button 'Archive'
    expect_success 'archived successfully'
    click_button 'Unarchive'
    expect_success 'unarchived successfully'

    page.should have_selector('.tab-title', count: 1)
    find('.tab-actions .dropdown-toggle').click
    find('li.duplicate').click
    page.should have_selector('.tab-title', count: 2)
    find('.tab-actions .dropdown-toggle').click
    find('li.delete').click
    find('li.delete-confirm').click
    page.should have_selector('.tab-title', count: 1)
    expect_success 'deleted successfully'
  end

  # The different editing widgets should be tested separately

end

