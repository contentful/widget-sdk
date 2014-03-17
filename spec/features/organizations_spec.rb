require 'spec_helper'

feature 'Organizations', js: true, order: :defined do
  include GatekeeperHelper

  before :all do
    reset_system
  end

  scenario 'Checking Memberships' do
   #ensure_login
   #delete_organizations
   #create_organization 'ABC'
   #create_space 'Montezuma', 'ABC'
   pending 'Not finished yet'

   #Add yourself as an Admin to Space
   #Add an existing user Mike to space as a ‘Developer’
   #Invite a new user Peter to space as an ‘Editor”
   #Create a new organization Bloomberg
   #Create a space ‘Guang Wu Di’ within the organization
   #Add an existing user Mike to space as a ‘Developer’
   # Add an existing user John to space as an ‘Editor’
   # Go to Account Settings / Profile / Organizations tab
   #expect to see Organizations ABC and Bloomberg listed and user role ‘Owner’ displayed;
   # Go to Account Settings / Profile / Spaces tab
   #expect to see only  ‘Montezuma’ space with role ‘Admin’ listed;
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

end
