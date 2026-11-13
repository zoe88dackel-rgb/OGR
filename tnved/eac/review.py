#!/usr/bin/env python3
"""Record a human subject-matter EAC review, bound to the exact knowledge version.

Usage:
 python3 tnved/eac/review.py --type clause --id TR_CU_008_2011_clause_1 \
  --reviewer "Name" --evidence-url "https://docs.eaeunion.org/..." \
  --note "Compared this scope and all exceptions with the current legal text"
 python3 tnved/eac/review.py --type rule --id toy_assessment ...
This script records a reviewer's attestation. It does not substitute for an
actual certification expert or provide a legal opinion.
"""
from pathlib import Path
from datetime import datetime,timezone
from hashlib import sha256
from urllib.parse import urlsplit
import argparse,json,re
HERE=Path(__file__).resolve().parent
SOURCE=HERE/"knowledge.json"
REVIEWS=HERE/"reviews.json"
p=argparse.ArgumentParser()
p.add_argument("--type",choices=["rule","clause"],required=True)
p.add_argument("--id",required=True)
p.add_argument("--reviewer",required=True)
p.add_argument("--evidence-url",required=True)
p.add_argument("--note",required=True)
a=p.parse_args()
library=json.loads(SOURCE.read_text("utf-8"))
source_hash=sha256(SOURCE.read_bytes()).hexdigest()
if not a.reviewer.strip() or len(a.note.strip())<20:
    p.error("Named reviewer and specific written rationale (20+ characters) required")
url=a.evidence_url.strip()
host=urlsplit(url).hostname or ""
if not url.startswith("https://") or not (host=="docs.eaeunion.org" or host.endswith(".eaeunion.org") or host=="protect.gost.ru"):
    p.error("Evidence must link directly to the official EAEU/EEC or Rosstandart source")
items=[]
for r in library["regulations"]:
    if a.type=="rule":
        items.extend(x["id"] for x in r["conditions"])
    else:
        items.extend(r["id"]+"_clause_"+str(i) for i in range(1,len(r["clauses"])+1))
if a.id not in items:p.error("Unknown item ID: "+a.id)
data=json.loads(REVIEWS.read_text("utf-8"))
section="rules" if a.type=="rule" else "clauses"
now=datetime.now(timezone.utc).isoformat()
data[section][a.id]={
    "item_id":a.id,
    "knowledge_sha256":source_hash,
    "reviewer":a.reviewer.strip(),
    "reviewed_at":now,
    "evidence_url":url,
    "review_note":a.note.strip()
}
data["meta"]["last_reviewed"]=now
REVIEWS.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("Recorded review:",a.type,a.id,"by",a.reviewer,"version",source_hash[:12])
