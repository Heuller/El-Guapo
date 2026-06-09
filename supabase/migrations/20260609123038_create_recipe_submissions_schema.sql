/*
# Recipe Submission & Feedback Schema

1. New Tables
- `recipes_submitted` — stores community-submitted recipes with minimal required fields
- `ratings` — simple star ratings linked to recipes
- `feedback` — quick feedback messages from users

2. Security
- Single-tenant app (no auth required). All tables use RLS with TO anon, authenticated.
- Data is intentionally public/shared.
*/

CREATE TABLE IF NOT EXISTS recipes_submitted (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text NOT NULL DEFAULT 'Especiais',
    description text,
    prep_time text,
    yield text,
    hydration_pct integer,
    method text,
    ingredients text[] NOT NULL DEFAULT '{}',
    steps text[] NOT NULL DEFAULT '{}',
    notes text,
    difficulty text DEFAULT 'Média',
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id text NOT NULL,
    rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    email text,
    message text NOT NULL,
    type text DEFAULT 'general',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE recipes_submitted ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_recipes_submitted" ON recipes_submitted;
CREATE POLICY "anon_select_recipes_submitted" ON recipes_submitted FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_recipes_submitted" ON recipes_submitted;
CREATE POLICY "anon_insert_recipes_submitted" ON recipes_submitted FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_ratings" ON ratings;
CREATE POLICY "anon_select_ratings" ON ratings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ratings" ON ratings;
CREATE POLICY "anon_insert_ratings" ON ratings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_feedback" ON feedback;
CREATE POLICY "anon_select_feedback" ON feedback FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_feedback" ON feedback;
CREATE POLICY "anon_insert_feedback" ON feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
