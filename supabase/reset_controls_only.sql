-- =====================================================
-- RAISE App - Complete Reset (Keep Controls Only)
-- =====================================================
-- This script:
-- 1. Removes ALL data from ALL tables
-- 2. Re-inserts the default controls from scratch
--
-- Use this for a complete fresh start with only controls.
-- =====================================================

-- Step 1: Clear all data (respecting FK order)
TRUNCATE TABLE opportunity_checkpoints CASCADE;
TRUNCATE TABLE kcp_deviations CASCADE;
TRUNCATE TABLE opportunities CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE control_template_links CASCADE;
TRUNCATE TABLE controls CASCADE;

-- Step 2: Re-insert default controls
-- These are the standard RAISE workflow controls

INSERT INTO controls (id, label, description, phase, sort_order, is_mandatory, action_type, condition, detailed_description)
VALUES
-- Planning Phase
('planning-1', 'Valutazione iniziale', 'Valutazione iniziale dell''opportunità', 'Planning', 1, true, 'task', NULL, 'Completare la valutazione iniziale dell''opportunità includendo analisi del cliente e del mercato.'),
('planning-2', 'Analisi requisiti', 'Analisi dei requisiti del cliente', 'Planning', 2, true, 'document', NULL, 'Documentare tutti i requisiti del cliente e le specifiche tecniche richieste.'),
('planning-3', 'Stima effort', 'Stima dell''effort necessario', 'Planning', 3, true, 'task', NULL, 'Calcolare l''effort necessario in termini di risorse e tempi.'),

-- ATP Phase (Authorization to Propose)
('atp-1', 'Approvazione commerciale', 'Approvazione del team commerciale', 'ATP', 1, true, 'task', NULL, 'Ottenere l''approvazione formale dal responsabile commerciale.'),
('atp-2', 'Verifica margini', 'Verifica dei margini economici', 'ATP', 2, true, 'document', 'tcv > 500000', 'Verificare che i margini siano in linea con le policy aziendali.'),
('atp-3', 'Review tecnica', 'Review tecnica della soluzione', 'ATP', 3, false, 'task', NULL, 'Effettuare una review tecnica della soluzione proposta.'),

-- ATS Phase (Authorization to Sign)
('ats-1', 'Revisione legale', 'Revisione del contratto da parte del legale', 'ATS', 1, true, 'document', NULL, 'Il team legale deve revisionare tutti i termini contrattuali.'),
('ats-2', 'Approvazione direzione', 'Approvazione della direzione', 'ATS', 2, true, 'task', 'tcv > 1000000', 'Per opportunità sopra 1M EUR, serve approvazione della direzione.'),
('ats-3', 'Verifica compliance', 'Verifica requisiti di compliance', 'ATS', 3, true, 'task', NULL, 'Verificare che tutti i requisiti di compliance siano soddisfatti.'),

-- ATC Phase (Authorization to Close)
('atc-1', 'Conferma cliente', 'Conferma accettazione del cliente', 'ATC', 1, true, 'document', NULL, 'Ottenere conferma scritta di accettazione dal cliente.'),
('atc-2', 'Firma contratto', 'Firma del contratto', 'ATC', 2, true, 'document', NULL, 'Completare la firma del contratto da entrambe le parti.'),
('atc-3', 'Registrazione ordine', 'Registrazione dell''ordine nel sistema', 'ATC', 3, true, 'task', NULL, 'Registrare l''ordine nel sistema gestionale.'),

-- Handover Phase
('handover-1', 'Passaggio consegne', 'Passaggio consegne al team delivery', 'Handover', 1, true, 'task', NULL, 'Completare il passaggio di consegne al team di delivery.'),
('handover-2', 'Documentazione progetto', 'Documentazione completa del progetto', 'Handover', 2, true, 'document', NULL, 'Preparare tutta la documentazione di progetto per il team operativo.'),
('handover-3', 'Kick-off meeting', 'Meeting di kick-off con il cliente', 'Handover', 3, false, 'task', NULL, 'Organizzare e condurre il meeting di kick-off con il cliente.');

-- Step 3: Verify the reset
SELECT
    'controls' AS table_name,
    COUNT(*) AS row_count
FROM controls

UNION ALL

SELECT
    'opportunities',
    COUNT(*)
FROM opportunities

UNION ALL

SELECT
    'customers',
    COUNT(*)
FROM customers;

-- =====================================================
-- Reset Complete - Database now contains only controls
-- =====================================================
