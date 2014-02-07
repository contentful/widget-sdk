require 'spec_helper'

feature 'Routing', js: true do
  include GatekeeperHelper

  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  scenario 'Opening pages from an external link' do
    visit "#{app_host}/account/profile/user"
    tab_iframe do
      expect(page).to have_text 'USER DETAILS'
    end

    visit "#{app_host}/account/organizations/#{organization_id}/billing/billing_address/edit"
    tab_iframe do
      expect(page).to have_text 'Postal code'
    end

    visit "#{app_host}/spaces/#{tutorial_space_id}/settings/users/new"
    tab_iframe do
      expect(page.find('input[name="commit"]')[:value]).to eql('Invite New User')
    end
  end
  
  scenario 'Opening pages through internal links' do
    nav_bar 'space-settings'
    tab_iframe do
      click_link 'Users'
      click_link 'Invite New User'
    end
    eventually {expect(current_path).to eql("/spaces/#{space_id}/settings/users/new")}

    find('.account-menus .user .dropdown-toggle').click
    within('.account-menus .user ') do
      first('li').click
    end
    eventually {expect(current_path).to eql("/account/profile/user")}

    tab_iframe do
      choose_organization 'Test User'
    end
    eventually {expect(current_path).to eql("/account/organizations/#{organization_id}/edit")}
  end
end
