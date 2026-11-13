-- TN VED + future EAC re-usable knowledge database (SQLite / D1-friendly).
-- Every rule has explicit source, version, review state and product-attribute conditions.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS sources(
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('tariff','regulation','implementation','translation','other')),
  publisher TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TEXT,
  retrieved_at TEXT,
  archive_sha256 TEXT,
  version_label TEXT,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS tariff_codes(
  code TEXT PRIMARY KEY CHECK(length(code)=10 AND code NOT GLOB '*[^0-9]*'),
  name_ru TEXT NOT NULL,
  chapter TEXT NOT NULL,
  heading TEXT NOT NULL,
  hs6 TEXT NOT NULL,
  effective_from TEXT,
  effective_to TEXT,
  source_id TEXT NOT NULL REFERENCES sources(id),
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tariff_chapter ON tariff_codes(chapter,code);
CREATE INDEX IF NOT EXISTS idx_tariff_heading ON tariff_codes(heading,code);
CREATE TABLE IF NOT EXISTS code_translations(
  code TEXT NOT NULL REFERENCES tariff_codes(code) ON DELETE CASCADE,
  lang TEXT NOT NULL CHECK(lang IN ('zh','en')),
  translated_name TEXT NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('machine','human','official')),
  model_id TEXT,
  review_status TEXT NOT NULL CHECK(review_status IN ('unreviewed','needs_context','approved','rejected')),
  translated_on TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  source_ru_sha256 TEXT NOT NULL,
  PRIMARY KEY(code,lang)
);
CREATE INDEX IF NOT EXISTS idx_code_review ON code_translations(lang,review_status,code);
CREATE TABLE IF NOT EXISTS regulations(
  regulation_id TEXT PRIMARY KEY,
  title_ru TEXT NOT NULL,
  title_zh TEXT,
  jurisdiction TEXT NOT NULL DEFAULT 'EAEU',
  source_id TEXT NOT NULL REFERENCES sources(id),
  effective_from TEXT,
  effective_to TEXT,
  review_status TEXT NOT NULL DEFAULT 'reference' CHECK(review_status IN ('reference','verified','withdrawn')),
  reviewed_by TEXT,
  reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS regulation_clauses(
  clause_id TEXT PRIMARY KEY,
  regulation_id TEXT NOT NULL REFERENCES regulations(regulation_id),
  clause_reference TEXT NOT NULL,
  scope_ru TEXT,
  scope_zh TEXT,
  effective_from TEXT,
  effective_to TEXT,
  source_id TEXT NOT NULL REFERENCES sources(id),
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK(review_status IN ('draft','verified','withdrawn')),
  reviewed_by TEXT,
  reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS applicability_rules(
  rule_id TEXT PRIMARY KEY,
  regulation_id TEXT NOT NULL REFERENCES regulations(regulation_id),
  clause_id TEXT REFERENCES regulation_clauses(clause_id),
  rule_type TEXT NOT NULL CHECK(rule_type IN ('in_scope','excluded','assessment')),
  code_prefix TEXT,
  predicates_json TEXT NOT NULL DEFAULT '{}',
  result_document TEXT CHECK(result_document IN ('COC','DOC','SGR','OTHER','NONE') OR result_document IS NULL),
  rationale TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  valid_from TEXT,
  valid_to TEXT,
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK(review_status IN ('draft','verified','withdrawn')),
  reviewed_by TEXT,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_rules_regulation ON applicability_rules(regulation_id,review_status);
CREATE TABLE IF NOT EXISTS products(
  product_id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_ru TEXT,
  material TEXT,
  function TEXT,
  intended_use TEXT,
  age_range TEXT,
  powered INTEGER CHECK(powered IN (0,1) OR powered IS NULL),
  specifications_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS product_classifications(
  classification_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(product_id),
  code TEXT NOT NULL REFERENCES tariff_codes(code),
  decision TEXT NOT NULL CHECK(decision IN ('candidate','accepted','rejected')),
  rationale TEXT,
  evidence_url TEXT,
  reviewer TEXT,
  reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS compliance_assessments(
  assessment_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(product_id),
  regulation_id TEXT NOT NULL REFERENCES regulations(regulation_id),
  status TEXT NOT NULL CHECK(status IN ('insufficient_data','possible','not_applicable','requires_document')),
  result_document TEXT CHECK(result_document IN ('COC','DOC','SGR','OTHER','NONE') OR result_document IS NULL),
  rule_ids_json TEXT NOT NULL DEFAULT '[]',
  evidence_json TEXT NOT NULL DEFAULT '[]',
  rationale TEXT,
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK(review_status IN ('draft','verified','withdrawn')),
  reviewer TEXT,
  reviewed_at TEXT
);
CREATE TABLE IF NOT EXISTS review_tasks(
  task_id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL CHECK(subject_type IN ('translation','classification','regulation','applicability','assessment')),
  subject_id TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','rejected')),
  assignee TEXT,
  created_at TEXT NOT NULL,
  closed_at TEXT
);
CREATE TABLE IF NOT EXISTS audit_events(
  event_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  actor TEXT NOT NULL,
  event_at TEXT NOT NULL
);
-- Product-specific EAC results are NEVER generated from HS codes alone.
-- Only rules with review_status='verified' can be evaluated in future apps.
CREATE VIEW IF NOT EXISTS verified_applicability AS
  SELECT * FROM applicability_rules WHERE review_status='verified';
CREATE VIEW IF NOT EXISTS review_backlog AS
  SELECT t.code,t.translated_name,t.review_status,c.name_ru,c.chapter,c.heading
  FROM code_translations t JOIN tariff_codes c USING(code)
  WHERE t.lang='zh' AND t.review_status IN ('needs_context','unreviewed');
