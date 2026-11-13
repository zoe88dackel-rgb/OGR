#!/usr/bin/env python3
"""Approve a TN VED Chinese translation with a source-specific audit trail.

Example:
python tnved/database/review.py --code 9503003500 \
  --zh "塑料制拼搭玩具（须结合上级品目理解）" \
  --reviewer "审核员" --note "查阅 FNS 俄文原文与上级品目"
This does not issue a classification ruling. Commit curated.json and
the database workflow will rebuild the approved Chinese entry.
"""
import argparse,hashlib,json,re
from pathlib import Path
from datetime import datetime,timezone
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
p=argparse.ArgumentParser()
p.add_argument("--code",required=True)
p.add_argument("--zh",required=True)
p.add_argument("--reviewer",required=True)
p.add_argument("--note",required=True,help="Brief evidence / reason for the review")
args=p.parse_args()
code=args.code.strip()
if not re.fullmatch(r"\d{10}",code):p.error("TN VED requires exactly 10 digits")
zh=args.zh.strip()
if len(zh)<6 or not re.search("[\u3400-\u9fff]",zh):p.error("Chinese description is too short")
reviewer=args.reviewer.strip()
note=args.note.strip()
if not reviewer or len(note)<8:p.error("Reviewer and detailed review rationale required")
catalog=json.loads((ROOT/"catalog.json").read_text("utf-8"))
rows={c:ru for c,ru in catalog["rows"]}
if code not in rows:p.error("Code not present in source snapshot")
ru=rows[code]
date=datetime.now(timezone.utc).isoformat()
curated_path=HERE/"curated.json"
curated=json.loads(curated_path.read_text("utf-8"))
approved=curated.setdefault("translations_reviewed",{})
old=approved.get(code)
approved[code]={
    "text":zh,
    "source_ru_sha256":hashlib.sha256(ru.encode("utf-8")).hexdigest(),
    "reviewed_by":reviewer,
    "reviewed_at":date,
    "review_note":note
}
curated.setdefault("review_events",[]).append({
    "event_id":"translation-approval-"+code+"-"+date.replace(":","").replace(".",""),
    "entity_type":"code_translation",
    "entity_id":code,
    "action":"translation_approved",
    "actor":reviewer,
    "event_at":date,
    "payload":{"old":old,"new":approved[code],"note":note}
})
curated_path.write_text(json.dumps(curated,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Approved:",code,"Chinese:",zh,"Reviewer:",reviewer)
