#!/usr/bin/env python3
"""Build a reusable, audit-friendly SQLite knowledge database.

Inputs: FNS full TN VED snapshot, unofficial Chinese translations and curated
reviewed data. No paid service, runtime AI, or N55 project files required.
The web site can continue using JSON; this SQLite database is a standalone
source for future Cloudflare D1 API and EAC regulation review workflows.
"""
from __future__ import annotations
import hashlib
import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = HERE / "compliance.sqlite"
NOW = datetime.now(timezone.utc).isoformat()
def jload(p):
    return json.loads(p.read_text("utf-8"))
def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
def sql(obj):
    return json.dumps(obj,ensure_ascii=False,separators=(",",":"))
def quality(zh):
    if not re.search(r"[\u3400-\u9fff]",zh):
        return "needs_context"
    if re.match(r"^\s*[-—–]\s*(其他|塑料|金属|木材|纺织|织物|材料|玻璃|橡胶|陶瓷|纸|棉|鞋)",zh):
        return "needs_context"
    if len(zh)<5 or zh.lstrip("-—– ").strip() in ("其他","塑料","其他材料","木材","金属"):
        return "needs_context"
    return "unreviewed"

def main():
    catalog_path = ROOT/"catalog.json"
    chinese_path = ROOT/"zh.json"
    catalog = jload(catalog_path)
    trans = jload(chinese_path)
    curated = jload(HERE/"curated.json")
    rows = catalog["rows"]
    translations = trans.get("translations",{})
    expected = int(catalog["meta"]["count"])
    if len(rows)!=expected or expected<10000:raise SystemExit("Incomplete FNS snapshot")
    codes = [r[0] for r in rows]
    if len(codes)!=len(set(codes)):raise SystemExit("Duplicate TN VED code")
    if any(len(c)!=10 or not c.isascii() or not c.isdigit() for c in codes):
        raise SystemExit("All codes must be 10 ASCII digits")
    # If translation source doesn't match, refuse to silently mix legal source versions.
    source_hash = hashlib.sha256(catalog_path.read_bytes()).hexdigest()
    if trans["meta"].get("source_sha256") != source_hash:
        raise SystemExit("Translated names are based on a different FNS snapshot. Retranslate first.")
    if set(translations)!=set(codes):
        raise SystemExit(f"Chinese translation coverage {len(translations)} does not match {expected} codes")
    reviewed = curated.get("translations_reviewed",{})
    if OUT.exists():OUT.unlink()
    con = sqlite3.connect(OUT)
    con.executescript((HERE/"schema.sql").read_text("utf-8"))
    con.execute("PRAGMA foreign_keys=ON")
    src="fns_tnved_"+str(catalog["meta"]["snapshot"]).replace("-","")
    meta=catalog["meta"]
    con.execute("""INSERT INTO sources (id,kind,publisher,title,url,published_at,retrieved_at,archive_sha256,version_label,notes)
                   VALUES (?,?,?,?,?,?,?,?,?,?)""",(
        src,"tariff","Federal Tax Service of Russia (FNS)",
        "FNS TN VED ЕАЭС downloadable code snapshot",
        meta["source_url"],meta.get("snapshot"),meta.get("generated_at"),meta.get("sha256"),meta.get("fns_header"),
        "Snapshot; must verify EEC amendments published after this version."
    ))
    for source in curated.get("sources",[]):
        con.execute("""INSERT INTO sources
          (id,kind,publisher,title,url,published_at,retrieved_at,archive_sha256,version_label,notes)
          VALUES (?,?,?,?,?,?,?,?,?,?)""", tuple(source.get(k) for k in
          ("id","kind","publisher","title","url","published_at","retrieved_at","archive_sha256","version_label","notes")))
    count_reviewed = 0
    needs_context = 0
    for code, ru in rows:
        ru = str(ru).strip()
        if not ru:raise SystemExit("Empty Russian source description for "+code)
        con.execute("""INSERT INTO tariff_codes(code,name_ru,chapter,heading,hs6,source_id,updated_at)
                       VALUES(?,?,?,?,?,?,?)""",(code,ru,code[:2],code[:4],code[:6],src,NOW))
        zh = str(translations[code]).strip()
        if not zh:raise SystemExit("Empty Chinese machine translation for "+code)
        entry=reviewed.get(code)
        if entry is not None:
            if entry.get("source_ru_sha256")!=digest(ru):
                raise SystemExit("Manual translation for "+code+" is stale; source has changed")
            if not entry.get("reviewed_by") or not entry.get("reviewed_at") or not entry.get("text"):
                raise SystemExit("Manual translation review for "+code+" lacks evidence")
            zh = entry["text"]
            status="approved"
            method="human"
            model_id=None
            reviewed_by=entry["reviewed_by"]
            reviewed_at=entry["reviewed_at"]
            count_reviewed+=1
        else:
            status=quality(zh)
            method="machine"
            model_id=trans["meta"].get("translation_model")
            reviewed_by=reviewed_at=None
        if status=="needs_context":needs_context+=1
        con.execute("""INSERT INTO code_translations
          (code,lang,translated_name,method,model_id,review_status,translated_on,reviewed_by,reviewed_at,source_ru_sha256)
          VALUES (?,?,?,?,?,?,?,?,?,?)""",
          (code,"zh",zh,method,model_id,status,trans["meta"].get("generated_at"),
           reviewed_by,reviewed_at,digest(ru)))
    for reg in curated.get("regulations",[]):
        con.execute("""INSERT INTO regulations
        (regulation_id,title_ru,title_zh,jurisdiction,source_id,effective_from,effective_to,review_status,reviewed_by,reviewed_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)""",tuple(reg.get(k) for k in
        ("regulation_id","title_ru","title_zh","jurisdiction","source_id","effective_from",
         "effective_to","review_status","reviewed_by","reviewed_at")))
    for clause in curated.get("clauses",[]):
        con.execute("""INSERT INTO regulation_clauses
        (clause_id,regulation_id,clause_reference,scope_ru,scope_zh,effective_from,effective_to,source_id,review_status,reviewed_by,reviewed_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)""",tuple(clause.get(k) for k in
        ("clause_id","regulation_id","clause_reference","scope_ru","scope_zh","effective_from",
         "effective_to","source_id","review_status","reviewed_by","reviewed_at")))
    for rule in curated.get("applicability_rules",[]):
        # Legal decision rules require product attributes, original legal clause,
        # named reviewer and source. HS code prefix alone can never decide EAC.
        if rule.get("review_status")=="verified":
            checks=("reviewed_by","reviewed_at","clause_id","source_id")
            if not all(rule.get(k) for k in checks):
                raise SystemExit("Verified EAC rule lacks source/reviewer: "+rule["rule_id"])
            predicates=rule.get("predicates",{})
            if not predicates or not isinstance(predicates,dict):
                raise SystemExit("Verified EAC rule needs product attributes: "+rule["rule_id"])
        con.execute("""INSERT INTO applicability_rules
        (rule_id,regulation_id,clause_id,rule_type,code_prefix,predicates_json,result_document,rationale,source_id,
         valid_from,valid_to,review_status,reviewed_by,reviewed_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",(
         rule["rule_id"],rule["regulation_id"],rule.get("clause_id"),
         rule["rule_type"],rule.get("code_prefix"),sql(rule.get("predicates",{})),
         rule.get("result_document"),rule["rationale"],rule["source_id"],rule.get("valid_from"),
         rule.get("valid_to"),rule.get("review_status","draft"),rule.get("reviewed_by"),rule.get("reviewed_at")
        ))
    for product in curated.get("products",[]):
        con.execute("""INSERT INTO products
        (product_id,name_zh,name_ru,material,function,intended_use,age_range,powered,specifications_json,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)""",(
         product["product_id"],product["name_zh"],product.get("name_ru"),product.get("material"),
         product.get("function"),product.get("intended_use"),product.get("age_range"),
         product.get("powered"),sql(product.get("specifications",{})),product.get("created_at",NOW),
         product.get("updated_at",NOW)
        ))
    for c in curated.get("product_classifications",[]):
        con.execute("""INSERT INTO product_classifications
        (classification_id,product_id,code,decision,rationale,evidence_url,reviewer,reviewed_at)
        VALUES(?,?,?,?,?,?,?,?)""",tuple(c.get(k) for k in
         ("classification_id","product_id","code","decision","rationale","evidence_url","reviewer","reviewed_at")))
    for c in curated.get("compliance_assessments",[]):
        if c.get("review_status")=="verified" and (not c.get("reviewer") or not c.get("reviewed_at")):
            raise SystemExit("Verified compliance assessment requires dated human review")
        con.execute("""INSERT INTO compliance_assessments
        (assessment_id,product_id,regulation_id,status,result_document,rule_ids_json,evidence_json,
         rationale,review_status,reviewer,reviewed_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)""",(
          c["assessment_id"],c["product_id"],c["regulation_id"],c["status"],
          c.get("result_document"),sql(c.get("rule_ids",[])),sql(c.get("evidence",[])),
          c.get("rationale"),c.get("review_status","draft"),c.get("reviewer"),c.get("reviewed_at")
        ))
    # Review priorities: every machine translation is unreviewed. Short or
    # context-dependent translations get a higher-priority review task.
    for code,status,zh in con.execute("""SELECT code,review_status,translated_name
        FROM code_translations WHERE lang='zh' AND review_status='needs_context' ORDER BY code""").fetchall():
        con.execute("""INSERT INTO review_tasks
        (task_id,subject_type,subject_id,issue_type,description,priority,status,created_at)
        VALUES(?,?,?,?,?,?,?,?)""",(
           "zh-"+code,"translation",code,"parent_context",
           "Short or context-dependent CN translation; check chapter/heading and Russian original: "+zh,1,"open",NOW))
    con.commit()
    problem=con.execute("PRAGMA foreign_key_check").fetchall()
    if problem:raise SystemExit("Foreign key violations: "+str(problem[:5]))
    integrity=con.execute("PRAGMA integrity_check").fetchone()[0]
    if integrity!="ok":raise SystemExit("SQLite integrity failure "+str(integrity))
    n=con.execute("SELECT COUNT(*) FROM tariff_codes").fetchone()[0]
    nt=con.execute("SELECT COUNT(*) FROM code_translations WHERE lang='zh'").fetchone()[0]
    if (n,nt)!=(expected,expected):raise SystemExit("Incomplete imported code / translation counts")
    info={
      "tariff_codes":n,
      "zh_translations":nt,
      "human_approved":count_reviewed,
      "machine_unreviewed":expected-count_reviewed,
      "needs_context":needs_context,
      "regulations":con.execute("SELECT COUNT(*) FROM regulations").fetchone()[0],
      "verified_EAC_rules":con.execute("SELECT COUNT(*) FROM verified_applicability").fetchone()[0],
      "snapshot":meta.get("snapshot"),
      "db_bytes":OUT.stat().st_size,
      "integrity":integrity,
      "warning":"Unofficial machine translation; EAC results must be reviewed against current law."
    }
    (HERE/"build-report.json").write_text(json.dumps(info,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    con.close()
    print(json.dumps(info,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
