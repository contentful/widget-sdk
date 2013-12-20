require 'spec_helper'

feature 'Roles', js:true, sauce: true, order: :defined do
  include GatekeeperHelper

  scenario 'Reset system' do
    reset_system
  end

  scenario 'Create Space and invite users' do
    ensure_login
    remove_test_space
    create_test_space
    nav_bar 'space-settings'
    tab_iframe do
      click_link 'Users'
      click_link 'Invite New User'
      find('#membership_email').set('testuser1@contentful.com')
      check 'Developer'
      click_button 'Invite New User'
    end
    expect_success 'invited successfully'
    tab_iframe do
      click_link 'Invite New User'
      find('#membership_email').set('testuser2@contentful.com')
      check 'Editor'
      click_button 'Invite New User'
    end
    expect_success 'invited successfully'
    ensure_logout
  end

  context 'Login as Developer' do
    let(:user){ "testuser1@contentful.com" }
    let(:password){ "password" }
    scenario "login" do
      ensure_login
      create_test_space
      expect(page).to_not have_selector(".nav-bar li[data-view-type=space-settings]")
      find('.add.button.dropdown-toggle').click
      dropdown_menu = find('.dropdown-menu')
      expect(dropdown_menu).to_not have_selector(".main-types li", text: 'Content Type')
      expect(dropdown_menu).to_not have_selector(".main-types li", text: 'Asset')
      expect(dropdown_menu).to_not have_selector(".main-types li", text: 'Entries')

      nav_bar 'content-type-list'
      expect(page).to_not have_selector('button', text: 'Create Content Type')
      nav_bar 'entry-list'
      expect(page).to_not have_selector('button', text: 'Create Content Type')
      nav_bar 'asset-list'
      expect(page).to_not have_selector('button', text: 'Create an Asset')
    end
  end

  context 'Login as Editor' do
    let(:user){ "testuser2@contentful.com" }
    let(:password){ "password" }
    scenario "login"
  end
end
