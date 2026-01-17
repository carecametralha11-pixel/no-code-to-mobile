-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'client');

-- Create enum for loan request status
CREATE TYPE public.loan_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'disbursed', 'completed');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'overdue');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    monthly_income DECIMAL(12,2),
    occupation TEXT,
    employer TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'client',
    UNIQUE (user_id, role)
);

-- Create loan_requests table
CREATE TABLE public.loan_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    term_months INTEGER NOT NULL,
    interest_rate DECIMAL(5,4) NOT NULL,
    monthly_payment DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    purpose TEXT,
    status loan_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    disbursed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan_documents table
CREATE TABLE public.loan_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_request_id UUID REFERENCES public.loan_requests(id) ON DELETE CASCADE NOT NULL,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan_references table
CREATE TABLE public.loan_references (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_request_id UUID REFERENCES public.loan_requests(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank_accounts table for loan disbursement
CREATE TABLE public.bank_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    bank_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    agency TEXT NOT NULL,
    account_number TEXT NOT NULL,
    pix_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan_payments table for tracking installments
CREATE TABLE public.loan_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_request_id UUID REFERENCES public.loan_requests(id) ON DELETE CASCADE NOT NULL,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2),
    paid_at TIMESTAMP WITH TIME ZONE,
    status payment_status NOT NULL DEFAULT 'pending',
    late_fee DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_settings table for configurable settings like interest rate
CREATE TABLE public.system_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('default_interest_rate', '0.025', 'Taxa de juros mensal padrão (2.5%)'),
('late_fee_percentage', '0.02', 'Multa por atraso (2%)'),
('late_interest_daily', '0.00033', 'Juros diário por atraso (0.033%)');

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_requests_updated_at
    BEFORE UPDATE ON public.loan_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON public.bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_payments_updated_at
    BEFORE UPDATE ON public.loan_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for loan_requests
CREATE POLICY "Users can view own loan requests"
    ON public.loan_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own loan requests"
    ON public.loan_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all loan requests"
    ON public.loan_requests FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all loan requests"
    ON public.loan_requests FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for loan_documents
CREATE POLICY "Users can view own documents"
    ON public.loan_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.loan_requests lr
            WHERE lr.id = loan_request_id AND lr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload own documents"
    ON public.loan_documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.loan_requests lr
            WHERE lr.id = loan_request_id AND lr.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all documents"
    ON public.loan_documents FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for loan_references
CREATE POLICY "Users can view own references"
    ON public.loan_references FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.loan_requests lr
            WHERE lr.id = loan_request_id AND lr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add own references"
    ON public.loan_references FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.loan_requests lr
            WHERE lr.id = loan_request_id AND lr.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all references"
    ON public.loan_references FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bank_accounts
CREATE POLICY "Users can view own bank account"
    ON public.bank_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bank account"
    ON public.bank_accounts FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bank accounts"
    ON public.bank_accounts FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for loan_payments
CREATE POLICY "Users can view own payments"
    ON public.loan_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.loan_requests lr
            WHERE lr.id = loan_request_id AND lr.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all payments"
    ON public.loan_payments FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all payments"
    ON public.loan_payments FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for system_settings
CREATE POLICY "Everyone can view settings"
    ON public.system_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage settings"
    ON public.system_settings FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('loan-documents', 'loan-documents', false);

-- Storage policies for loan documents
CREATE POLICY "Users can upload own documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'loan-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'loan-documents' AND public.has_role(auth.uid(), 'admin'));