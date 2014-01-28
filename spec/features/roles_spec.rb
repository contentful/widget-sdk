require 'spec_helper'

feature 'Roles', js:true, order: :defined do
  include GatekeeperHelper
  include ContentTypeHelper

  before :all do
    clear_access_token
  end

  after :all do
    clear_access_token
  end

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
    create_content_type 'Text'
    ensure_logout
  end

  context 'Login as Developer' do
    let(:user){ "testuser1@contentful.com" }
    let(:password){ "password" }

    after do
      ensure_logout
    end

    scenario "login" do
      ensure_login
      select_space
      expect(page).to_not have_selector(".nav-bar li[data-view-type=space-settings]")
      find('.add.button.dropdown-toggle').click
      dropdown_menu = find('.dropdown-menu')
      expect(dropdown_menu).to_not have_selector(".main-types li", text: 'Content Type')
      expect(dropdown_menu).to_not have_selector(".main-types li", text: 'Asset')
      expect(dropdown_menu).to_not have_selector(".main-types li", text: 'Entries')

      nav_bar 'entry-list'
      expect(page).to_not have_selector('button', text: 'Create Content Type')
      nav_bar 'asset-list'
      expect(page).to_not have_selector('button', text: 'Create an Asset')
    end
  end

  context 'Login as Editor' do
    let(:user){ "testuser2@contentful.com" }
    let(:password){ "password" }

    after do
      ensure_logout
    end

    scenario "login" do
      ensure_login
      select_space
      expect(page).to_not have_selector(".nav-bar li[data-view-type=space-settings]")
      debugger
      expect(page).to_not have_selector(".nav-bar li[data-view-type=content-type-list]")
      find('.add.button.dropdown-toggle').click
      dropdown_menu = find('.dropdown-menu')
      expect(dropdown_menu).to_not have_selector(".main-types li", text: 'Content Type')
      expect(dropdown_menu).to     have_selector(".main-types li", text: 'Asset')
      debugger
      expect(dropdown_menu).to     have_selector(".content-types li")
      nav_bar 'entry-list'
      expect(page).to_not have_selector('button', text: 'Create Content Type')
      nav_bar 'asset-list'
      expect(page).to     have_selector('button', text: 'Create an Asset')
    end
  end
end
