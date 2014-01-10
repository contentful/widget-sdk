require 'spec_helper'

feature 'Routing', js: true do
  before do
    ensure_login
    remove_test_space
    create_test_space
  end

  after do
    remove_test_space
  end

  scenario 'Opening pages from an external link' do
    visit "#{app_host}/profile"
    tab_iframe do
      expect(page).to have_text 'USER DETAILS'
    end

    visit "#{app_host}/profile/billing/billing_address/edit"
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

    find('.account .user .dropdown-toggle').click
    within('.account .user ') do
      first('li').click
    end
    eventually {expect(current_path).to eql("/profile/user")}

    tab_iframe do
      click_link 'Subscription'
    end
    eventually {expect(current_path).to eql("/profile/subscription")}
  end
end
