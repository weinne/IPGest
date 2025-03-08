-- Alterar o tipo da coluna plan_id para text
ALTER TABLE subscriptions ALTER COLUMN plan_id TYPE text USING plan_id::text; 