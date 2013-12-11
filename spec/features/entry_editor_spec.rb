require 'spec_helper'

feature 'Entry Editor', js: true, sauce: true do
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

  scenario 'Playing with the tab actions' do
    create_content_type 'Text'
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

  scenario 'toggling languages and disabled fields' do
    nav_bar 'space-settings'
    tab_iframe do
      click_link 'Locales'
      click_link 'New Locale'
      fill_in 'locale_name', with: 'German'
      fill_in 'locale_code', with: 'de-DE'
      click_button 'Create Locale'
    end

    create_content_type 'Text' do
      add_field 'Localized Field', 'Text', localized: true
      add_field 'Disabled Field', 'Text'
      wait_for_sharejs
      click_button 'Activate'
      find('.toggle-disabled').click
    end

    add_button 'Entry with Text'
    wait_for_sharejs
    page.should have_selector('.form-field[data-field-id=textField] textarea')
    page.should have_selector('.form-field[data-field-id=localizedField] .locale[data-locale="en-US"] textarea')

    find('.editor-top-right .dropdown-toggle').click
    find('label', text: 'German').click
    page.should have_selector('.form-field[data-field-id=textField] textarea')
    page.should have_selector('.form-field[data-field-id=localizedField] .locale[data-locale="en-US"] textarea')
    page.should have_selector('.form-field[data-field-id=localizedField] .locale[data-locale="de-DE"] textarea')

    find('label', text: 'disabled').click
    page.should have_selector('.form-field[data-field-id=textField] textarea')
    page.should have_selector('.form-field[data-field-id=localizedField] .locale[data-locale="en-US"] textarea')
    page.should have_selector('.form-field[data-field-id=localizedField] .locale[data-locale="de-DE"] textarea')
    page.should have_selector('.form-field[data-field-id=disabledField] textarea')
  end

  # The different editing widgets should be tested separately

end

