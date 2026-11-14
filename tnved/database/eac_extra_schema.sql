-- Independent EAC extension. These tables are candidates/reference only until audited.
-- Existing TN VED tables and product classification remain untouched.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS eac_reference_sources(
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  publisher TEXT NOT NULL,
  source_type TEXT NOT NULL,
  published_on TEXT,
  notes TEXT,
  checked_on TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS eac_knowledge_regulations(
  id TEXT PRIMARY KEY REFERENCES regulations(regulation_id),
  display_code TEXT NOT NULL,
  sector TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES eac_reference_sources(id),
  scope_zh TEXT NOT NULL,
  exclusion_zh TEXT NOT NULL,
  assessment_zh TEXT NOT NULL,
  attributes_json TEXT NOT NULL DEFAULT '[]',
  review_status TEXT NOT NULL DEFAULT 'reference' CHECK(review_status IN ('reference','verified','withdrawn')),
  reviewed_by TEXT,reviewed_at TEXT,
  CHECK ((review_status != 'verified') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS eac_clause_summaries(
  id TEXT PRIMARY KEY,
  regulation_id TEXT NOT NULL REFERENCES eac_knowledge_regulations(id),
  reference TEXT NOT NULL,
  summary_zh TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES eac_reference_sources(id),
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK(review_status IN ('draft','verified','withdrawn')),
  reviewed_by TEXT,reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_eac_clause_reg ON eac_clause_summaries(regulation_id);
CREATE TABLE IF NOT EXISTS eac_candidate_rules(
  id TEXT PRIMARY KEY,
  regulation_id TEXT NOT NULL REFERENCES eac_knowledge_regulations(id),
  rule_type TEXT NOT NULL CHECK(rule_type IN ('scope','exclusion','assessment')),
  proposed_document TEXT,
  required_attributes_json TEXT NOT NULL,
  explanation_zh TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES eac_reference_sources(id),
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK(review_status IN ('draft','verified','withdrawn')),
  reviewed_by TEXT,reviewed_at TEXT,
  CHECK (review_status != 'verified' OR
     (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_eac_rule_reg ON eac_candidate_rules(regulation_id,review_status);
CREATE TABLE IF NOT EXISTS eac_document_forms(
  document_code TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  document_category TEXT NOT NULL,
  verify_source_id TEXT REFERENCES eac_reference_sources(id),
  notes TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS eac_regulation_events(
  id TEXT PRIMARY KEY,
  regulation_id TEXT NOT NULL REFERENCES eac_knowledge_regulations(id),
  event_type TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES eac_reference_sources(id),
  decision_number TEXT,
  adopted_on TEXT,
  published_on TEXT,
  effective_on TEXT,
  state TEXT NOT NULL,
  note_zh TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eac_event_effective ON eac_regulation_events(effective_on,regulation_id);
CREATE TABLE IF NOT EXISTS eac_case_templates(
  case_id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  category_zh TEXT NOT NULL,
  possible_regulations_json TEXT NOT NULL,
  required_inputs_json TEXT NOT NULL,
  candidate_documents_json TEXT NOT NULL,
  state_zh TEXT NOT NULL,
  rationale_zh TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK(review_status IN ('draft','verified'))
);
CREATE TABLE IF NOT EXISTS eac_certificate_records(
  id TEXT PRIMARY KEY,
  certificate_no TEXT NOT NULL,
  document_code TEXT NOT NULL REFERENCES eac_document_forms(document_code),
  issuing_country TEXT NOT NULL,
  applicant TEXT,
  manufacturer TEXT,
  product_scope TEXT,
  registry_url TEXT,
  issue_date TEXT,
  expiration_date TEXT,
  last_check_at TEXT,
  last_registry_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK(last_registry_status IN ('unverified','valid','expired','suspended','terminated','not_found','inaccessible')),
  check_evidence TEXT,
  reviewer TEXT,
  CHECK(last_registry_status='unverified' OR (last_check_at IS NOT NULL AND registry_url IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS eac_certificate_checks(
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES eac_certificate_records(id),
  checked_at TEXT NOT NULL,
  observed_status TEXT NOT NULL,
  source_url TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  checked_by TEXT NOT NULL
);
-- Human verification gate: candidate classification rules cannot become positive
-- document recommendations merely because they exist in the reference database.
CREATE VIEW IF NOT EXISTS eac_verified_candidate_rules AS
SELECT * FROM eac_candidate_rules WHERE review_status='verified';
CREATE VIEW IF NOT EXISTS eac_pending_review AS
SELECT 'rule' AS item_type,id AS item_id,regulation_id,explanation_zh AS description
FROM eac_candidate_rules WHERE review_status='draft'
UNION ALL
SELECT 'clause',id,regulation_id,summary_zh
FROM eac_clause_summaries WHERE review_status='draft';

-- Clause-based, concrete sourced legal-reference records for the EAC catalogue.
-- Status 'reference' does NOT authorize automatic compliance or certification decisions.
CREATE TABLE IF NOT EXISTS eac_article_requirements(
  requirement_id TEXT PRIMARY KEY,
  regulation_id TEXT NOT NULL REFERENCES eac_knowledge_regulations(id),
  article_reference TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  summary_zh TEXT NOT NULL,
  applicability_condition TEXT NOT NULL,
  candidate_document TEXT,
  scheme_codes_json TEXT NOT NULL DEFAULT '[]',
  source_url TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'reference'
    CHECK(review_status IN ('reference','expert_approved','withdrawn')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  CHECK (review_status!='expert_approved' OR
    (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_eac_requirement_regulation
ON eac_article_requirements(regulation_id,article_reference);
CREATE INDEX IF NOT EXISTS idx_eac_requirement_review
ON eac_article_requirements(review_status,regulation_id);
