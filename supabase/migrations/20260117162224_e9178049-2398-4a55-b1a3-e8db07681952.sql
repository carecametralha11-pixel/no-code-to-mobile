-- Add request_location column to loan_requests
ALTER TABLE public.loan_requests 
ADD COLUMN request_location JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.loan_requests.request_location IS 'GPS coordinates captured at time of loan request {latitude, longitude, accuracy, city}';

-- Create push_tokens table for push notifications
CREATE TABLE public.push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable Row Level Security
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for push_tokens
CREATE POLICY "Users can view their own push tokens" 
ON public.push_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens" 
ON public.push_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens" 
ON public.push_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens" 
ON public.push_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();