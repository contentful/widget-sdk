require 'spec_helper'

feature 'Working with locales', js: true, sauce: true do
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

  scenario 'Adding a locale' do
    nav_bar 'space-settings'
    tab_iframe do
      click_link 'Locales'
      click_link 'New Locale'
      fill_in 'locale_name', with: 'German'
      fill_in 'locale_code', with: 'de-DE'
      click_button 'Create Locale'

      click_link 'New Locale'
      fill_in 'locale_name', with: 'French'
      fill_in 'locale_code', with: 'fr-FR'
      uncheck 'locale_publish'
      uncheck 'locale_content_delivery_api'
      click_button 'Create Locale'
    end

    add_button 'Content Type'
    fill_in 'contentTypeName', with: 'Test Content Type'
    add_field 'Text', 'Text'
    add_field 'Text localized', 'Text', localized: true
    wait_for_sharejs
    click_button 'Activate'

    add_button 'Test Content Type'
    wait_for_sharejs
    find('.editor-top-right .dropdown-toggle').click
    expect(find('.editor-top-right .dropdown-menu')).to_not have_text('French')
    find('label', text: 'German').click
    expect(page).to have_selector('div[data-locale="de-DE"]')
  end
end
