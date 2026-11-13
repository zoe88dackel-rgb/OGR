#!/usr/bin/env python3
"""Validate and attach the EAC library to the reproducible SQLite knowledge DB.
Never generates legally final CoC/DoC/SGR outcomes from the draft rules.
"""
import json,sqlite3,sys,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
LIB=ROOT/"eac"/"knowledge.json"
DB=HERE/"compliance.sqlite"
data=json.loads(LIB.read_text("utf-8"))
knowledge_sha=hashlib.sha256(LIB.read_bytes()).hexdigest()
review_file=ROOT/"eac"/"reviews.json"
reviews=json.loads(review_file.read_text("utf-8"))
def reviewed(kind,item_id):
    item=reviews.get(kind,{}).get(item_id)
    if not item:return None
    if item.get("knowledge_sha256")!=knowledge_sha:
        raise SystemExit("EAC review invalidated by source change: "+item_id)
    if not all(item.get(k) for k in ("reviewer","reviewed_at","evidence_url","review_note")):
        raise SystemExit("Incomplete EAC review audit: "+item_id)
    source_url=item["evidence_url"]
    if not source_url.startswith("https://") or not any(x in source_url for x in (
        "docs.eaeunion.org","eec.eaeunion.org","protect.gost.ru")):
        raise SystemExit("Reviewer source must be official: "+item_id)
    return item

regulations=data["regulations"]
if len(regulations)<6:raise SystemExit("Less than 6 verified reference entries in catalogue")
if any(len(r.get("conditions",[]))<1 or len(r.get("clauses",[]))<2 for r in regulations):
    raise SystemExit("Missing regulation clause/rule outlines")
if not DB.exists():raise SystemExit("Build base TN VED database first")
con=sqlite3.connect(DB)
con.execute("PRAGMA foreign_keys=ON")
con.executescript((HERE/"eac_extra_schema.sql").read_text("utf-8"))
today="2026-11-13"
def dump(x):return json.dumps(x,ensure_ascii=False,separators=(",",":"))
for source in data["sources"]:
    con.execute("""INSERT OR REPLACE INTO eac_reference_sources
        (id,url,title,publisher,source_type,published_on,notes,checked_on)
        VALUES(?,?,?,?,?,?,?,?)""",
        (source["id"],source["url"],source["name"],source["publisher"],source["type"],
         source.get("published"),source.get("note"),today))
for reg in regulations:
    if not con.execute("SELECT 1 FROM regulations WHERE regulation_id=?",(reg["id"],)).fetchone():
        raise SystemExit("Legal source absent from base regulations: "+reg["id"])
    con.execute("""INSERT OR REPLACE INTO eac_knowledge_regulations
       (id,display_code,sector,source_id,scope_zh,exclusion_zh,assessment_zh,attributes_json,review_status)
       VALUES(?,?,?,?,?,?,?,?,?)""",
       (reg["id"],reg["code"],reg["sector"],reg["original"],reg["scope"],
        reg["exclude"],reg["assessment"],dump(reg["attributes"]),"reference"))
    for idx,(ref,summary) in enumerate(reg["clauses"],1):
        cid=reg["id"]+"_clause_"+str(idx)
        approval=reviewed("clauses",cid)
        con.execute("""INSERT OR REPLACE INTO eac_clause_summaries
          (id,regulation_id,reference,summary_zh,source_id,review_status,reviewed_by,reviewed_at)
          VALUES(?,?,?,?,?,?,?,?)""",
          (cid,reg["id"],ref,summary,reg["original"],"verified" if approval else "draft",
           approval.get("reviewer") if approval else None,
           approval.get("reviewed_at") if approval else None))
    for rule in reg["conditions"]:
        if len(rule.get("when",[]))<2:
            raise SystemExit("Rule missing non-code product attributes "+rule["id"])
        if rule.get("status")=="verified":
            raise SystemExit("Unreviewed EAC rule cannot be prelabelled verified "+rule["id"])
        approval=reviewed("rules",rule["id"])
        if rule["form"] is not None and rule["form"] not in ("COC","DOC","SGR","OTHER"):
            raise SystemExit("Unsupported assessment form "+str(rule["form"]))
        con.execute("""INSERT OR REPLACE INTO eac_candidate_rules
        (id,regulation_id,rule_type,proposed_document,required_attributes_json,explanation_zh,source_id,review_status,reviewed_by,reviewed_at)
        VALUES(?,?,?,?,?,?,?,?,?,?)""",
         (rule["id"],reg["id"],rule["type"],rule["form"],
          dump(rule["when"]),rule["note"],reg["original"],
          "verified" if approval else "draft",
          approval.get("reviewer") if approval else None,
          approval.get("reviewed_at") if approval else None))
for doc in data["documents"]:
    con.execute("""INSERT OR REPLACE INTO eac_document_forms
       (document_code,title_zh,title_ru,document_category,verify_source_id,notes)
       VALUES(?,?,?,?,?,?)""",
       (doc["id"],doc["zh"],doc["ru"],doc["type"],doc["verify"],doc["notes"]))
for item in data["versions"]:
    con.execute("""INSERT OR REPLACE INTO eac_regulation_events
    (id,regulation_id,event_type,source_id,decision_number,adopted_on,published_on,effective_on,state,note_zh)
    VALUES(?,?,?,?,?,?,?,?,?,?)""",
      (item["id"],item["regulation"],item["kind"],item["source"],item["decision"],
       item.get("adopted"),item.get("published"),item.get("effective"),item["state"],item["note"]))
for c in data["cases"]:
    for rid in c["regulations"]:
        if not con.execute("SELECT 1 FROM regulations WHERE regulation_id=?",(rid,)).fetchone():
            raise SystemExit("Case references unknown regulation "+rid)
    for code in c["docs"]:
        if not any(t["id"]==code for t in data["documents"]):
            raise SystemExit("Case references unknown document "+code)
    con.execute("""INSERT OR REPLACE INTO eac_case_templates
       (case_id,name_zh,category_zh,possible_regulations_json,required_inputs_json,candidate_documents_json,
        state_zh,rationale_zh,review_status)
        VALUES(?,?,?,?,?,?,?,?,?)""",
       (c["id"],c["zh"],c["category"],dump(c["regulations"]),dump(c["fields"]),
        dump(c["docs"]),c["result"],c["description"],"draft"))
con.commit()
if con.execute("PRAGMA integrity_check").fetchone()[0]!="ok":raise SystemExit("Corrupt DB")
fk=con.execute("PRAGMA foreign_key_check").fetchall()
if fk:raise SystemExit("Foreign key errors: "+str(fk))
stats={
"regulations":con.execute("SELECT COUNT(*) FROM eac_knowledge_regulations").fetchone()[0],
"clauses_to_review":con.execute("SELECT COUNT(*) FROM eac_clause_summaries WHERE review_status='draft'").fetchone()[0],
"draft_rules":con.execute("SELECT COUNT(*) FROM eac_candidate_rules WHERE review_status='draft'").fetchone()[0],
"verified_rules":con.execute("SELECT COUNT(*) FROM eac_verified_candidate_rules").fetchone()[0],
"official_source_references":con.execute("SELECT COUNT(*) FROM eac_reference_sources").fetchone()[0],
"regulation_events":con.execute("SELECT COUNT(*) FROM eac_regulation_events").fetchone()[0],
"document_types":con.execute("SELECT COUNT(*) FROM eac_document_forms").fetchone()[0],
"seller_cases":con.execute("SELECT COUNT(*) FROM eac_case_templates").fetchone()[0],
"registered_certificates":con.execute("SELECT COUNT(*) FROM eac_certificate_records").fetchone()[0],
"integrity":"ok"}
if stats["regulations"]!=6 or stats["draft_rules"]+stats["verified_rules"]<12 or stats["verified_rules"]!=len(reviews.get("rules",{})):
    raise SystemExit("Unexpected EAC verification state "+dump(stats))
report_file=HERE/"build-report.json"
report=json.loads(report_file.read_text("utf-8"))
report["eac_library"]=stats
report["db_bytes"]=DB.stat().st_size
report_file.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(stats,ensure_ascii=False,indent=2))
con.close()
