-- Add the 'option' column to subscription_plans table if it doesn't exist
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS option JSONB;

-- Create questionnaire_completions table to track user questionnaire completions
CREATE TABLE IF NOT EXISTS questionnaire_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    questionnaire_id VARCHAR(255) NOT NULL,
    questionnaire_title VARCHAR(255),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responses JSONB,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id and questionnaire_id for faster queries
CREATE INDEX IF NOT EXISTS idx_questionnaire_completions_user_questionnaire 
ON questionnaire_completions(user_id, questionnaire_id);

-- Create index on user_id and completed_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_questionnaire_completions_user_completed 
ON questionnaire_completions(user_id, completed_at);

-- Create questionnaires table to store available questionnaires
CREATE TABLE IF NOT EXISTS questionnaires (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE `app_settings`
  ADD COLUMN `border_color` VARCHAR(7) NOT NULL DEFAULT '#e5e7eb' AFTER `accent_color`,
  ADD COLUMN `primary_button_color` VARCHAR(7) NOT NULL DEFAULT '#9b87f5' AFTER `border_color`,
  ADD COLUMN `secondary_button_color` VARCHAR(7) NOT NULL DEFAULT '#7E69AB' AFTER `primary_button_color`,
  ADD COLUMN `box_background_color` VARCHAR(7) NOT NULL DEFAULT '#ffffff' AFTER `secondary_button_color`,
  ADD COLUMN `text_color` VARCHAR(7) NOT NULL DEFAULT '#000000' AFTER `box_background_color`;

-- Insert sample questionnaires if they don't exist
INSERT INTO questionnaires (id, title, description, questions, sort_order) VALUES
('questionnaire-1', 'Valutazione Maturità Digitale', 'Analisi del livello di digitalizzazione aziendale', '[]', 1),
('questionnaire-2', 'Analisi Processi Aziendali', 'Ottimizzazione dei processi interni', '[]', 2),
('questionnaire-3', 'Strategia Marketing Digitale', 'Sviluppo strategia di marketing online', '[]', 3),
('questionnaire-4', 'Sicurezza Informatica', 'Valutazione della sicurezza IT', '[]', 4)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for questionnaire_completions
ALTER TABLE questionnaire_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own completions
CREATE POLICY IF NOT EXISTS "Users can view own questionnaire completions" ON questionnaire_completions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own completions
CREATE POLICY IF NOT EXISTS "Users can insert own questionnaire completions" ON questionnaire_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own completions
CREATE POLICY IF NOT EXISTS "Users can update own questionnaire completions" ON questionnaire_completions
    FOR UPDATE USING (auth.uid() = user_id);

-- Add RLS policies for questionnaires (read-only for authenticated users)
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all questionnaires
CREATE POLICY IF NOT EXISTS "Authenticated users can view questionnaires" ON questionnaires
    FOR SELECT USING (auth.role() = 'authenticated');

-- Update function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_questionnaire_completions_updated_at 
    BEFORE UPDATE ON questionnaire_completions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_questionnaires_updated_at 
    BEFORE UPDATE ON questionnaires 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
