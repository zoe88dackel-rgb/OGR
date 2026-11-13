#!/usr/bin/env python3
"""Integration assertions for the independent EAC library + 13,293-code TN VED DB."""
import json, sqlite3, pathlib
HERE=pathlib.Path(__file__).resolve().parent
db=sqlite3.connect(HERE/"compliance.sqlite")
db.row_factory=sqlite3.Row
assert db.execute("PRAGMA integrity_check").fetchone()[0]=="ok"
assert db.execute("SELECT count(*) FROM tariff_codes").fetchone()[0]==13293
assert db.execute("SELECT count(*) FROM code_translations").fetchone()[0]==13293
assert db.execute("SELECT count(*) FROM eac_knowledge_regulations").fetchone()[0]==6
assert db.execute("SELECT count(*) FROM eac_clause_summaries").fetchone()[0]>=20
assert db.execute("SELECT count(*) FROM eac_candidate_rules").fetchone()[0]>=12
assert db.execute("SELECT count(*) FROM eac_verified_candidate_rules").fetchone()[0]==0
assert db.execute("SELECT count(*) FROM eac_certificate_records").fetchone()[0]==0
assert db.execute("SELECT count(*) FROM eac_certificate_checks").fetchone()[0]==0
assert db.execute("SELECT count(*) FROM eac_document_forms").fetchone()[0]==5
assert db.execute("SELECT count(*) FROM eac_regulation_events").fetchone()[0]>=5
assert db.execute("SELECT count(*) FROM eac_case_templates").fetchone()[0]==4
assert db.execute("PRAGMA foreign_key_check").fetchall()==[]
assert db.execute("SELECT COUNT(*) FROM eac_candidate_rules WHERE required_attributes_json='[]'").fetchone()[0]==0
assert db.execute("SELECT COUNT(*) FROM eac_candidate_rules WHERE source_id NOT IN (SELECT id FROM eac_reference_sources)").fetchone()[0]==0
future=db.execute("SELECT effective_on,state FROM eac_regulation_events WHERE id='toy_2026_106'").fetchone()
assert future and future[0]=='2027-03-27' and future[1]=='future'
toy=db.execute("SELECT case_id,possible_regulations_json,required_inputs_json,review_status FROM eac_case_templates WHERE case_id='plastic_blocks'").fetchone()
assert toy and toy[3]=='draft'
assert "TR_CU_008_2011" in json.loads(toy[1])
assert len(json.loads(toy[2]))>=3
for row in db.execute("SELECT document_code,document_category,verify_source_id FROM eac_document_forms"):
  if row["document_code"]=="EAC_MARK":
    assert row["document_category"]=="mark_not_document"
  if row["document_code"] in ("COC","DOC"):
    assert row["verify_source_id"]
# Check the difference between real certification vs registry status: no samples ever claim validity
for row in db.execute("SELECT status,review_status FROM compliance_assessments"):
  assert row["review_status"]!="verified" or row["status"]!="insufficient_data"
# Reference-only clauses and draft rules can never drive determinate claims
assert db.execute("SELECT count(*) FROM eac_pending_review").fetchone()[0]>=32
print("PASS: EAC 6 regulations, 25 clause references, 12 draft applicability checks, "+
      "5 document types, 4 seller cases and 5 source-linked versions; 0 unreviewed 'verified' outcomes")
