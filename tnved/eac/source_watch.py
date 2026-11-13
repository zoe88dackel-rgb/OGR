#!/usr/bin/env python3
"""Monitor official source bytes. A page hash change is NOT proof law changed.
Never promote EAC rules or certificate validity automatically.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
from urllib.request import Request,urlopen
from urllib.parse import urlsplit
from datetime import datetime,timezone
from hashlib import sha256
import json,sys
ROOT=Path(__file__).resolve().parent
LIB=ROOT/"knowledge.json"
REPORT=ROOT/"source_watch.json"
data=json.loads(LIB.read_text("utf-8"))
old=json.loads(REPORT.read_text("utf-8")) if REPORT.exists() else {"items":{}}
previous=old.get("items",{})
now=datetime.now(timezone.utc).isoformat()
sources=[x for x in data["sources"] if x["type"]!="registry"]
def inspect(s):
    url=s["url"];host=urlsplit(url).hostname or ""
    if host not in ("docs.eaeunion.org","eec.eaeunion.org","protect.gost.ru"):
        return s["id"],{"status":"untrusted_domain","url":url,"checked_at":now}
    item=previous.get(s["id"],{})
    out={"url":url,"checked_at":now,"publisher":s["publisher"],
         "prior_sha256":item.get("sha256")}
    try:
        req=Request(url,headers={"User-Agent":"EACSourceMonitor/1.0 (reference update checker; no automatic legal conclusion)","Accept":"text/html,application/pdf"})
        with urlopen(req,timeout=18) as res:
            status=res.status
            content_type=(res.headers.get("Content-Type") or "").lower()
            raw=res.read(8000001)
        out["http_status"]=status
        out["content_type"]=content_type
        if len(raw)>8000000:raise ValueError("Source bigger than 8 MB, cannot hash safely")
        if len(raw)<160:raise ValueError("Unexpectedly short document")
        if "pdf" not in content_type and "html" not in content_type:
            raise ValueError("Unexpected content-type "+content_type)
        if raw[:250].lower().find(b"captcha")>-1:
            raise ValueError("Captcha/interstitial returned")
        dig=sha256(raw).hexdigest()
        prior=item.get("sha256")
        out["sha256"]=dig
        # EEC HTML portals include dynamic date, session, and navigation markup.
        # A whole-HTML hash is not a stable indicator of actual legal amendments.
        # Track accessibility only for HTML, never emit a false "amendment" alert.
        if "html" in content_type:
            out["status"]="html_page_accessible_not_version_verified"
            out["requires_manual_review"]=False
        else:
            # PDF is more stable, though byte changes still require a human check.
            out["status"]="baseline" if not prior else ("unchanged" if prior==dig else "pdf_bytes_changed_needs_review")
            if prior and prior!=dig and item.get("content_type","").find("pdf")>=0:
                out["requires_manual_review"]=True
    except Exception as exc:
        out["status"]="unavailable"
        out["error"]=type(exc).__name__+': '+str(exc)[:120]
        if item.get("sha256"):out["sha256"]=item["sha256"]
    return s["id"],out
with ThreadPoolExecutor(max_workers=6) as pool:
    futures=[pool.submit(inspect,s) for s in sources]
    results=dict(f.result() for f in as_completed(futures))
body={
  "generated_at":now,
  "checked_sources":len(sources),
  "changes_needing_review":sum(x.get("requires_manual_review",False) for x in results.values()),
  "inaccessible_sources":sum(x["status"] in ("unavailable","untrusted_domain") for x in results.values()),
  "notice":"Bytes changing is a signal for manual legal review; not verified amendment or document status.",
  "items":results
}
REPORT.write_text(json.dumps(body,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")
print("Checked",len(sources),"changes",body["changes_needing_review"],"inaccessible",body["inaccessible_sources"],flush=True)
if body["changes_needing_review"]:
    print("WARNING: Manual legal source review required; verified rules must be rechecked",flush=True)
