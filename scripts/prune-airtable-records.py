#!/usr/bin/env python3
"""Backup brushing records through ARCHIVE_UNTIL, then keep only dates >= KEEP_FROM.

Requires env: AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME
Run only after monthly API quota is available again.
"""
import json, os, urllib.parse, urllib.request
from datetime import datetime

KEEP_FROM = os.environ.get("RECORDS_KEEP_FROM", "2026-08-01")
ARCHIVE_UNTIL = os.environ.get("RECORDS_ARCHIVE_UNTIL", "2026-09-29")
BACKUP_KEY = os.environ.get("RECORDS_BACKUP_KEY", "brushing_records_backup_20260929")
TOKEN = os.environ["AIRTABLE_TOKEN"].strip()
BASE = os.environ["AIRTABLE_BASE_ID"].strip()
TABLE = os.environ.get("AIRTABLE_TABLE_NAME", "ChallengeDB").strip()

def req(method, url, body=None):
    data = None if body is None else json.dumps(body).encode()
    r = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(r, timeout=60) as res:
        return json.loads(res.read().decode())

def main():
    table_q = urllib.parse.quote(TABLE)
    root = f"https://api.airtable.com/v0/{BASE}/{table_q}"
    listed = req("GET", f"{root}?maxRecords=100")
    by_key = {}
    for rec in listed.get("records", []):
        fields = rec.get("fields", {})
        key = fields.get("Key")
        if key:
            by_key[key] = rec

    rec = by_key.get("brushing_records")
    if not rec:
        raise SystemExit("brushing_records not found")
    raw = json.loads(rec["fields"]["Value"])
    archived = {
        sk: {d: v for d, v in days.items() if d <= ARCHIVE_UNTIL}
        for sk, days in raw.items()
    }
    archived = {sk: days for sk, days in archived.items() if days}
    pruned = {
        sk: {d: v for d, v in days.items() if d >= KEEP_FROM}
        for sk, days in raw.items()
    }
    pruned = {sk: days for sk, days in pruned.items() if days}

    backup_payload = {
        "archivedAt": datetime.utcnow().isoformat() + "Z",
        "until": ARCHIVE_UNTIL,
        "records": archived,
    }
    if BACKUP_KEY in by_key:
        req("PATCH", f"{root}/{by_key[BACKUP_KEY]['id']}", {"fields": {"Value": json.dumps(backup_payload, ensure_ascii=False)}})
    else:
        req("POST", root, {"records": [{"fields": {"Key": BACKUP_KEY, "Value": json.dumps(backup_payload, ensure_ascii=False)}}]})

    req("PATCH", f"{root}/{rec['id']}", {"fields": {"Value": json.dumps(pruned, ensure_ascii=False)}})
    before = sum(len(v) for v in raw.values())
    after = sum(len(v) for v in pruned.values())
    print(f"backup={BACKUP_KEY} days {before} -> {after} (keep>={KEEP_FROM})")

if __name__ == "__main__":
    main()
