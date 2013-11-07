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
    iframe = find('iframe')
    within_frame iframe do
      page.should have_text 'USER DETAILS'
    end

    visit "#{app_host}/profile/billing_address/edit"
    iframe = find('iframe')
    within_frame iframe do
      page.should have_text 'Postal code'
    end

    visit "#{app_host}/spaces/#{tutorial_space_id}/settings/users/new"
    iframe = find('iframe')
    within_frame iframe do
      page.find('input[name="commit"]')[:value].should eql('Invite New User')
    end
  end
  
  scenario 'Opening pages through internal links', non_ci: true do
    nav_bar 'space-settings'
    iframe = find('iframe')
    within_frame iframe do
      click_link 'Users'
      click_link 'Invite New User'
    end
    eventually {current_path.should eql("/spaces/#{space_id}/settings/users/new")}

    find('.account .user .dropdown-toggle').click
    within('.account .user ') do
      first('li').click
    end
    eventually {current_path.should eql("/profile/user")}

    iframe = find('iframe')
    within_frame iframe do
      click_link 'Subscription'
    end
    eventually {current_path.should eql("/profile/subscription")}
  end
end
