#!/usr/bin/env python3
"""Import the official Russian FNS 10-digit TN VED catalogue for a standalone static website."""
from pathlib import Path
from urllib.request import Request,urlopen
from zipfile import ZipFile
from datetime import datetime,date
from io import BytesIO
import json,hashlib,re
folder=Path(__file__).resolve().parent
urls=['https://data.nalog.ru/files/tnved/tnved.zip','https://data.nalog.ru/html/sites/www.new.nalog.ru/2023/program/TNVED.ZIP']
raw=None;url_used=None
for url in urls:
 try:
  with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=50) as response:
   downloaded=response.read(30000000)
  if downloaded[:2]!=b'PK':raise ValueError('Not a ZIP file')
  raw=downloaded;url_used=url;break
 except Exception as e: print('Source failed:',url,e)
if raw is None: raise SystemExit('Unable to retrieve official FNS archive; keeping previous data')
with ZipFile(BytesIO(raw)) as z:
 entries=[s for s in z.namelist() if s.upper().endswith('TNVED4.TXT')]
 if len(entries)!=1:raise SystemExit('Unexpected official archive format')
 lines=z.read(entries[0]).decode('cp866').splitlines()
today=date.today()
def parse(s):
 try:return datetime.strptime(s.strip(),'%d.%m.%Y').date() if s.strip() else None
 except ValueError:return None
records={}
for line in lines[1:]:
 parts=line.split('|')
 if len(parts)<6:continue
 a,b,c=parts[:3]
 if not(re.fullmatch(r'\d{2}',a) and re.fullmatch(r'\d{2}',b) and re.fullmatch(r'\d{6}',c)):continue
 code=a+b+c;label=parts[3].strip()
 if not label:continue
 start,end=parse(parts[4]),parse(parts[5])
 if (start and start>today) or (end and end<today):continue
 if code not in records or (start or date.min)>records[code][0]:
  records[code]=(start,label)
rows=[[code,records[code][1]] for code in sorted(records)]
if len(rows)<10000:raise SystemExit('Incomplete catalogue: only '+str(len(rows))+' codes')
meta={'count':len(rows),'snapshot':'2026-04-27','fns_header':lines[0],
 'generated_at':today.isoformat(),'source_url':url_used,
 'source_page':'https://www.nalog.gov.ru/rn77/program/5961290/',
 'sha256':hashlib.sha256(raw).hexdigest(),
 'notice':'Verify later EEC amendments. This is the FNS April 2026 snapshot.'}
out=folder/'catalog.json'
out.write_text(json.dumps({'meta':meta,'rows':rows},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print('PASS: '+str(len(rows))+' active ten-digit codes; '+str(out.stat().st_size)+' bytes')
