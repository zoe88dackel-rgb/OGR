#!/usr/bin/env python3
"""Offline Chinese machine translations for all FNS TN VED descriptions.
Non-official: always display the Russian names alongside these search aids.
Usage: python translate_zh.py shard INDEX TOTAL
       python translate_zh.py merge translation-parts/
"""
import json, os, re, sys
from datetime import datetime,timezone
from hashlib import sha256
from pathlib import Path
HERE=Path(__file__).resolve().parent
CATALOG=HERE/"catalog.json"
MODEL="utrobinmv/t5_translate_en_ru_zh_small_1024"
def catalogue():
    d=json.loads(CATALOG.read_text(encoding="utf-8"))
    if len(d["rows"])<10000 or len(d["rows"])!=int(d["meta"]["count"]):
        raise SystemExit("Source catalogue incomplete")
    return d
def shard(index,count):
    import torch
    from transformers import T5Tokenizer, T5ForConditionalGeneration
    torch.set_num_threads(min(4,os.cpu_count() or 2))
    d=catalogue()
    rows=[r for n,r in enumerate(d["rows"]) if n%count==index]
    print("Translating",len(rows),"items; shard",index,"model",MODEL,flush=True)
    tok=T5Tokenizer.from_pretrained(MODEL)
    model=T5ForConditionalGeneration.from_pretrained(MODEL,torch_dtype=torch.float32).eval()
    result={}
    with torch.inference_mode():
        for start in range(0,len(rows),12):
            group=rows[start:start+12]
            prompts=["translate to zh: "+r[1] for r in group]
            inputs=tok(prompts,return_tensors="pt",padding=True,truncation=True,max_length=440)
            output=model.generate(**inputs,max_new_tokens=210,num_beams=1,do_sample=False)
            translations=tok.batch_decode(output,skip_special_tokens=True)
            for (code,ru),zh in zip(group,translations):
                zh=zh.strip()
                if not zh:raise RuntimeError("Empty translation "+code)
                result[code]=zh
            if start%120==0:print("Shard",index,"translated",len(result),"/",len(rows),flush=True)
    assert len(result)==len(rows)
    folder=Path("translation-parts")
    folder.mkdir(exist_ok=True)
    (folder/f"zh-{index:02d}.json").write_text(json.dumps({
      "shard":index,"shards":count,"catalog_sha256":sha256(CATALOG.read_bytes()).hexdigest(),
      "model":MODEL,"rows":result},ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    print("Shard done",index,len(result),flush=True)
def merge(path):
    d=catalogue();group=Path(path)
    paths=sorted(group.rglob("zh-*.json"))
    if not paths:raise SystemExit("Translation shard files missing")
    expected=int(json.loads(paths[0].read_text(encoding="utf-8"))["shards"])
    digest=sha256(CATALOG.read_bytes()).hexdigest()
    seen=set();mapping={}
    for p in paths:
        chunk=json.loads(p.read_text(encoding="utf-8"))
        if chunk["shards"]!=expected or chunk["catalog_sha256"]!=digest:
            raise SystemExit("Source mismatch: "+str(p))
        if chunk["shard"] in seen:raise SystemExit("Duplicate shard")
        seen.add(chunk["shard"])
        for code,zh in chunk["rows"].items():
            if code in mapping or not isinstance(zh,str) or not zh.strip():
                raise SystemExit("Invalid translation "+code)
            mapping[code]=zh
    codes={x[0] for x in d["rows"]}
    if len(seen)!=expected or set(mapping)!=codes:
        raise SystemExit(f"Incomplete: {len(seen)} shards, {len(mapping)} codes, expected {len(codes)}")
    no_han=sum(not re.search(r"[\u3400-\u9fff]",v) for v in mapping.values())
    payload={
      "meta":{"count":len(mapping),"translated_count":len(mapping),
        "no_han_count":no_han,"translation_model":MODEL,
        "source_sha256":digest,"source_snapshot":d["meta"].get("snapshot"),
        "generated_at":datetime.now(timezone.utc).isoformat(),
        "notice":"Unofficial machine translated labels for search only. Russian source takes precedence."},
      "translations":mapping}
    out=HERE/"zh.json"
    out.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print("MERGE PASS",len(mapping),"codes",no_han,"non-Han entries",out.stat().st_size,"bytes",flush=True)
if __name__=="__main__":
    if len(sys.argv)<3:raise SystemExit("Usage: shard INDEX TOTAL | merge DIRECTORY")
    if sys.argv[1]=="shard":shard(int(sys.argv[2]),int(sys.argv[3]))
    elif sys.argv[1]=="merge":merge(sys.argv[2])
    else:raise SystemExit("Unknown mode")
