export interface UserData {
  email: string;
  displayName: string;
  city: string;
  stateRegion: string;
  country: string;
  bio: string;
  role: 'authenticated_user' | 'vendor_admin' | 'vendor_member' | 'support_agent' | 'trust_analyst' | 'moderator' | 'admin';
}

export const USERS: UserData[] = [
  { email: 'sarah.johnson@example.com', displayName: 'Sarah Johnson', city: 'Portland', stateRegion: 'OR', country: 'US', bio: 'Dog lover and rescue advocate. Adopted 3 dogs over the past decade.', role: 'authenticated_user' },
  { email: 'mike.chen@example.com', displayName: 'Mike Chen', city: 'Seattle', stateRegion: 'WA', country: 'US', bio: 'First-time pet parent looking for the perfect furry friend.', role: 'authenticated_user' },
  { email: 'jessica.williams@example.com', displayName: 'Jessica Williams', city: 'Los Angeles', stateRegion: 'CA', country: 'US', bio: 'Cat enthusiast and volunteer at local shelters.', role: 'authenticated_user' },
  { email: 'david.martinez@example.com', displayName: 'David Martinez', city: 'Denver', stateRegion: 'CO', country: 'US', bio: 'Avid bird watcher turned exotic bird owner. Passionate about avian welfare.', role: 'authenticated_user' },
  { email: 'emily.davis@example.com', displayName: 'Emily Davis', city: 'Austin', stateRegion: 'TX', country: 'US', bio: 'Veterinary technician who loves connecting people with their perfect pets.', role: 'authenticated_user' },
  { email: 'james.wilson@example.com', displayName: 'James Wilson', city: 'Chicago', stateRegion: 'IL', country: 'US', bio: 'Multi-pet household: 2 dogs, 3 cats, and a parrot.', role: 'authenticated_user' },
  { email: 'amanda.taylor@example.com', displayName: 'Amanda Taylor', city: 'Phoenix', stateRegion: 'AZ', country: 'US', bio: 'Looking to adopt a senior dog. Believe every pet deserves love.', role: 'authenticated_user' },
  { email: 'robert.brown@example.com', displayName: 'Robert Brown', city: 'San Francisco', stateRegion: 'CA', country: 'US', bio: 'Tech worker and cat dad to two Maine Coons.', role: 'authenticated_user' },
  { email: 'ashley.garcia@example.com', displayName: 'Ashley Garcia', city: 'Miami', stateRegion: 'FL', country: 'US', bio: 'Bird breeder for 15 years. Love sharing knowledge about avian care.', role: 'authenticated_user' },
  { email: 'ryan.thomas@example.com', displayName: 'Ryan Thomas', city: 'Minneapolis', stateRegion: 'MN', country: 'US', bio: 'Foster parent for rescue dogs. Have fostered over 50 dogs to date.', role: 'authenticated_user' },
  { email: 'nicole.anderson@example.com', displayName: 'Nicole Anderson', city: 'Boston', stateRegion: 'MA', country: 'US', bio: 'Poodle lover and AKC show competitor.', role: 'authenticated_user' },
  { email: 'chris.jackson@example.com', displayName: 'Chris Jackson', city: 'Atlanta', stateRegion: 'GA', country: 'US', bio: 'Small dog enthusiast. My Yorkie is my best friend.', role: 'authenticated_user' },
  { email: 'maria.rodriguez@example.com', displayName: 'Maria Rodriguez', city: 'Dallas', stateRegion: 'TX', country: 'US', bio: 'Animal welfare advocate and shelter volunteer since 2010.', role: 'authenticated_user' },
  { email: 'kevin.lee@example.com', displayName: 'Kevin Lee', city: 'Bellevue', stateRegion: 'WA', country: 'US', bio: 'First-time bird owner looking for a cockatiel or budgie.', role: 'authenticated_user' },
  { email: 'rachel.white@example.com', displayName: 'Rachel White', city: 'Nashville', stateRegion: 'TN', country: 'US', bio: 'Cat breeder and TICA judge. Specializing in Ragdolls.', role: 'authenticated_user' },
  { email: 'jason.harris@example.com', displayName: 'Jason Harris', city: 'Las Vegas', stateRegion: 'NV', country: 'US', bio: 'Retired firefighter looking for an active companion dog.', role: 'authenticated_user' },
  { email: 'karen.clark@example.com', displayName: 'Karen Clark', city: 'Philadelphia', stateRegion: 'PA', country: 'US', bio: 'Empty nester wanting to adopt a pair of cats for companionship.', role: 'authenticated_user' },
  { email: 'brian.lewis@example.com', displayName: 'Brian Lewis', city: 'Raleigh', stateRegion: 'NC', country: 'US', bio: 'Canary and finch hobbyist with a backyard aviary.', role: 'authenticated_user' },
  { email: 'stephanie.hall@example.com', displayName: 'Stephanie Hall', city: 'Tampa', stateRegion: 'FL', country: 'US', bio: 'Family of four searching for a friendly family dog.', role: 'authenticated_user' },
  { email: 'daniel.young@example.com', displayName: 'Daniel Young', city: 'Kansas City', stateRegion: 'MO', country: 'US', bio: 'Dog trainer and behavioral specialist with 10 years experience.', role: 'authenticated_user' },
  { email: 'linda.walker@example.com', displayName: 'Linda Walker', city: 'Hartford', stateRegion: 'CT', country: 'US', bio: 'Persian cat breeder. Active in local cat shows and feline welfare.', role: 'authenticated_user' },
  { email: 'mark.allen@example.com', displayName: 'Mark Allen', city: 'Honolulu', stateRegion: 'HI', country: 'US', bio: 'Island living with tropical birds. Love lorikeets and conures.', role: 'authenticated_user' },
  { email: 'laura.scott@example.com', displayName: 'Laura Scott', city: 'Washington', stateRegion: 'DC', country: 'US', bio: 'Apartment dweller looking for a cat-friendly breed for small spaces.', role: 'authenticated_user' },
  { email: 'tom.adams@example.com', displayName: 'Tom Adams', city: 'Anchorage', stateRegion: 'AK', country: 'US', bio: 'Husky owner and amateur musher. Love big working breeds.', role: 'authenticated_user' },
  { email: 'jenny.mitchell@example.com', displayName: 'Jenny Mitchell', city: 'New Orleans', stateRegion: 'LA', country: 'US', bio: 'Parrot enthusiast and avian rescue volunteer.', role: 'authenticated_user' },
  // Vendor users
  { email: 'vendor.sarah@happypaws.example.com', displayName: 'Sarah Miller', city: 'Portland', stateRegion: 'OR', country: 'US', bio: 'Shelter manager at Happy Paws for 8 years.', role: 'vendor_admin' },
  { email: 'vendor.tom@sunrisebreeders.example.com', displayName: 'Tom Reynolds', city: 'Seattle', stateRegion: 'WA', country: 'US', bio: 'Head breeder at Sunrise Breeders since founding.', role: 'vendor_admin' },
  { email: 'vendor.lisa@secondchance.example.com', displayName: 'Lisa Nguyen', city: 'Los Angeles', stateRegion: 'CA', country: 'US', bio: 'Rescue coordinator and foster manager.', role: 'vendor_admin' },
  { email: 'vendor.mark@mvhumane.example.com', displayName: 'Mark Henderson', city: 'Denver', stateRegion: 'CO', country: 'US', bio: 'Executive director of Mountain View Humane Society.', role: 'vendor_admin' },
  { email: 'vendor.ana@featheredfriends.example.com', displayName: 'Ana Castillo', city: 'Austin', stateRegion: 'TX', country: 'US', bio: 'Aviculturist and bird behavior specialist.', role: 'vendor_admin' },
  // Staff
  { email: 'staff.kim@happypaws.example.com', displayName: 'Kim Park', city: 'Portland', stateRegion: 'OR', country: 'US', bio: 'Adoption counselor at Happy Paws.', role: 'vendor_member' },
  { email: 'staff.alex@mvhumane.example.com', displayName: 'Alex Rivera', city: 'Denver', stateRegion: 'CO', country: 'US', bio: 'Animal care technician at Mountain View Humane.', role: 'vendor_member' },
  { email: 'staff.pat@bayareahumane.example.com', displayName: 'Pat O\'Brien', city: 'San Francisco', stateRegion: 'CA', country: 'US', bio: 'Volunteer coordinator and adoption specialist.', role: 'vendor_member' },
  // Internal roles
  { email: 'support.agent1@petcentral.com', displayName: 'Diana Foster', city: 'Portland', stateRegion: 'OR', country: 'US', bio: 'Customer support agent at Pet Central.', role: 'support_agent' },
  { email: 'support.agent2@petcentral.com', displayName: 'Carlos Ruiz', city: 'Portland', stateRegion: 'OR', country: 'US', bio: 'Customer support agent specializing in vendor relations.', role: 'support_agent' },
  { email: 'trust.analyst@petcentral.com', displayName: 'Priya Sharma', city: 'Portland', stateRegion: 'OR', country: 'US', bio: 'Trust and safety analyst at Pet Central.', role: 'trust_analyst' },
  { email: 'moderator@petcentral.com', displayName: 'Sam Washington', city: 'Portland', stateRegion: 'OR', country: 'US', bio: 'Content moderator ensuring platform safety.', role: 'moderator' },
];
