require 'spec_helper'

feature 'Working with locales', js: true do
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

    create_content_type 'Text' do
      add_field 'Localized Field', 'Text', localized: true
    end

    add_button 'Entry with Text'
    wait_for_sharejs
    find('.editor-top-right .dropdown-toggle').click
    expect(find('.editor-top-right .dropdown-menu')).to_not have_text('French')
    find('label', text: 'German').click
    expect(page).to have_selector('div[data-locale="de-DE"]')
  end
end
