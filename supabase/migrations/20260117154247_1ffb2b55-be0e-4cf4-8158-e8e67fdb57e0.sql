-- Add unique constraint on profiles.user_id if not exists
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Add foreign key from loan_requests to profiles
ALTER TABLE public.loan_requests 
ADD CONSTRAINT loan_requests_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from bank_accounts to profiles  
ALTER TABLE public.bank_accounts
ADD CONSTRAINT bank_accounts_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;