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
    visit '/profile'
    find 'iframe'
    within_frame 0 do
      page.should have_text 'USER DETAILS'
    end

    visit "/profile/billing_address/edit"
    find 'iframe'
    within_frame 0 do
      page.should have_text 'Postal code'
    end

    visit "/spaces/#{space_id}/settings/users/new"
    find 'iframe'
    within_frame 0 do
      page.find('input[name="commit"]')[:value].should eql('Invite New User')
    end
  end
  
  scenario 'Opening pages through internal links' do
    nav_bar 'space-settings'
    within_frame 0 do
      click_link 'Users'
      click_link 'Invite New User'
    end
    current_path.should eql("/spaces/#{space_id}/settings/users/new")

    find('.account .user .dropdown-toggle').click
    within('.account .user ') do
      first('li').click
    end
    current_path.should eql("/profile/user")

    iframe = find('iframe')
    within_frame iframe do
      click_link 'Subscription'
    end
    current_path.should eql("/profile/subscription")
  end
end
