require 'spec_helper'

feature 'Organizations', js: true, order: :defined, quirely_only: true do
  include GatekeeperHelper

  before :all do
    reset_system
  end
 
  let(:mike)  { 'testuser1@contentful.com' }
  let(:john)  { 'testuser2@contentful.com' }
  let(:peter) {  'newuser1@contentful.com' }

  scenario 'Checking Memberships' do
    pending 'These tests are useless and I will design new ones later'
    ensure_login
    delete_organizations
    create_organization 'ABC'
    create_space 'Montezuma', 'ABC'
    
    #Add an existing user Mike to space as a ‘Developer’
    add_user(mike, 'Developer')
    #Invite a new user Peter to space as an ‘Editor”
    add_user(peter, 'Editor')
    #Create a new organization Bloomberg
    create_organization 'Bloomberg'
    #Create a space ‘Guang Wu Di’ within the organization
    create_space 'Guang Wu Di', 'Bloomberg'
    #Add an existing user Mike to space as a ‘Developer’
    add_user(mike, 'Developer')
    #Invite a new user Peter to space as an ‘Editor”
    add_user(peter, 'Editor')
    visit "#{app_host}/account/profile/organization_memberships"
    #expect to see Organizations ABC and Bloomberg listed and user role ‘Owner’ displayed;
    #WRONG roles are not displayed in that table
    tab_iframe do
      expect(page).to have_text('ABC')
      expect(page).to have_text('Bloomberg')
    end
    visit "#{app_host}/account/profile/spaces"
    #expect to see only  ‘Montezuma’ space with role ‘Admin’ listed;
    #WRONG: I created every space, so I am admin everywhere
    #WRONG roles not displayed in table
    tab_iframe do
      expect(page).to have_text('Montezuma')
      expect(page).to have_text('Guang Wu Di')
    end

    

    pending 'Not finished yet'
    # Go to Account Settings / Profile / Spaces tab
    #expect to see ‘Montezuma’ listed, but not ‘Guang Wu Di’;
    # Go to Account Settings / Organization ABC / Spaces tab 
    #expect to see only ‘Montezuma’ listed;
    #expect to see Mike : Developer and Peter : Editor listed;
    # In the same tab, add user Sharon to space ‘Montezuma’
    #expect to see Sharon : Editor listed in space member table;
    # Go to Account Settings / Organization Bloomberg / Spaces tab
    #expect to see only ‘Guang Wu Di’ listed;
    #expect to see Mike : Developer and John : Editor listed;
    # In the same tab, remove user Mike from space ‘Guang Wu Di’
    #expect to see ‘Guang Wu Di’ member table without Mike;
    # Login as ’Mike’ and go to Account Settings / Profile / Organizations
    #expect to see only Bloomberg listed;
    # Login as ’Peter’ and go to Account Settings / Profile / Organizations
    #expect to see only ABC listed;
    # Login as default user and go to Account Settings / Organization Bloomberg / Users tab
    # Add a new user ‘Sharon’ as ‘Owner’ to the Organization
    # Login as ’Sharon’ and go to Account Settings / Profile / Organizations
    #expect to see ‘ABC’ and ‘Bloomberg’ listed;
    # Go to Account Settings / Profile / Spaces
    #expect to see only ‘Montezuma’ listed
    #    
  end
  scenario 'Checking Restrictions'

  def add_user(email, roles)
    nav_bar 'space-settings'
    tab_iframe do
      click_link 'Users'
      click_link 'Invite New User'
      find('#space_membership_email').set(email)
      roles.each{|role| check role}
      click_button 'Invite New User'
    end
    expect_success 'invited successfully'
  end

end
