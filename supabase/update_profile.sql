-- Update the profile back to original values
UPDATE user_profiles 
SET 
  full_name = 'sfour',
  avatar_url = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  source_language = 'syrian',
  target_language = 'lebanese',
  updated_at = NOW()
WHERE id = 'd00501d5-1b89-4249-9262-5b47a7742f04'
RETURNING *;
