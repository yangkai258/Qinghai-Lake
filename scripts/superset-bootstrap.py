#!/usr/bin/env python3
"""
Superset bootstrap — connects to Superset as admin (default admin/admin),
registers the read-only Postgres connection, builds a Dataset on
v_douyin_account_latest, and creates 6 named charts + 1 "data-tw 大屏" dashboard.

This script is meant to run AFTER:
  1. docker compose up -d superset (wait ~60s for init)
  2. psql -U postgres -d dashboard -f packages/db/setup-superset.sql

Usage:
  python3 scripts/superset-bootstrap.py

Or if your superset is on another host:
  SUPERSET_URL=http://localhost:8088 ADMIN_USER=admin ADMIN_PASSWORD=admin \\
    python3 scripts/superset-bootstrap.py
"""
from __future__ import annotations
import os
import sys
import time
import json
import urllib.request
import urllib.parse
import urllib.error
import base64

SUPERSET = os.environ.get("SUPERSET_URL", "http://localhost:8088")
USER = os.environ.get("ADMIN_USER", "admin")
PASS = os.environ.get("ADMIN_PASSWORD", "admin")

# Read-only role connection URI (matches setup-superset.sql)
DB_URI = os.environ.get(
    "SUPERSET_DATABASE_URI",
    "postgresql://superset:superset_readonly_2026@postgres:5432/dashboard",
)


def req(method: str, path: str, *, json_body=None, params=None, raise_=True):
    url = SUPERSET + path + ("?" + urllib.parse.urlencode(params) if params else "")
    data = None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if json_body is not None:
        data = json.dumps(json_body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    auth = base64.b64encode(f"{USER}:{PASS}".encode()).decode()
    req.add_header("Authorization", f"Basic {auth}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read()
            return resp.status, json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        if raise_:
            print(f"[!] HTTP {e.code} {method} {url}\n    {body[:500]}")
            raise
        return e.code, body


def login_and_get_csrf() -> str:
    """Superset API requires both basic auth AND a CSRF token in headers."""
    return ""  # python urllib with basic-auth is enough for the REST API


def wait_for_superset(timeout: int = 120):
    print(f"[..] waiting for {SUPERSET}/health ({timeout}s)")
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(SUPERSET + "/health", timeout=3) as r:
                if r.status == 200:
                    print(f"[ok] superset ready after {int(time.time()-start)}s")
                    return
        except Exception:
            time.sleep(2)
    print("[!] superset not reachable after {timeout}s")
    sys.exit(1)


def get_or_create_database() -> int:
    status, body = req("GET", "/api/v1/database/")
    if isinstance(body, dict) and "result" in body:
        for d in body["result"]:
            if d.get("database_name") == "data-tw":
                print(f"[ok] database 'data-tw' already exists (id={d['id']})")
                return d["id"]
    # Create
    status, body = req(
        "POST",
        "/api/v1/database/",
        json_body={
            "database_name": "data-tw",
            "sqlalchemy_uri": DB_URI,
            "expose_in_sqllab": True,
            "allow_run_async": False,
            "allow_ctas": False,
            "allow_dml": False,  # read-only: no INSERT/UPDATE/DELETE from Superset SQL Lab
            "allow_file_upload": False,
        },
    )
    db_id = body.get("id") if isinstance(body, dict) else None
    print(f"[ok] created database id={db_id}")
    return db_id


def get_or_create_dataset(db_id: int) -> int:
    status, body = req(
        "GET",
        "/api/v1/dataset/",
        params={"filters": json.dumps([{"col": "table_name", "opr": "eq", "value": "v_douyin_account_latest"}])},
    )
    if isinstance(body, dict) and "result" in body and body["result"]:
        ds = body["result"][0]
        print(f"[ok] dataset already exists id={ds['id']}")
        return ds["id"]
    status, body = req(
        "POST",
        "/api/v1/dataset/",
        json_body={
            "database": db_id,
            "schema": "public",
            "table_name": "v_douyin_account_latest",
        },
    )
    ds_id = body.get("id") if isinstance(body, dict) else None
    print(f"[ok] created dataset id={ds_id}")
    return ds_id


def create_chart(name: str, viz_type: str, ds_id: int, params: dict) -> int:
    payload = {
        "slice_name": name,
        "viz_type": viz_type,
        "datasource_id": ds_id,
        "datasource_type": "table",
        "params": json.dumps(params),
    }
    status, body = req("POST", "/api/v1/chart/", json_body=payload)
    if isinstance(body, dict) and "id" in body:
        print(f"[ok] chart '{name}' id={body['id']}")
        return body["id"]
    print(f"[!] chart '{name}' failed: {body}")
    return -1


def create_dashboard(title: str, chart_ids: list[int]) -> int:
    payload = {
        "dashboard_title": title,
        "slug": "data-tw-screens",
        "published": True,
        "positions": {
            str(cid): {
                "type": "CHART",
                "meta": {"chartId": cid, "width": 8, "height": 6},
                "children": [],
            } for cid in chart_ids
        },
    }
    status, body = req("POST", "/api/v1/dashboard/", json_body=payload)
    if isinstance(body, dict) and "id" in body:
        print(f"[ok] dashboard '{title}' id={body['id']}")
        return body["id"]
    print(f"[!] dashboard '{title}' failed: {body}")
    return -1


def main():
    wait_for_superset()
    db_id = get_or_create_database()
    if not db_id:
        sys.exit(1)
    ds_id = get_or_create_dataset(db_id)
    if not ds_id:
        sys.exit(1)

    # Six charts. viz_types supported out of the box in Superset 4.x:
    charts = [
        ("高层决策屏", "big_number_total", {"metric": "count", "header_font_size": 0.4}),
        ("运营作战屏", "table", {"columns": ["account_name","dept","plays_inc","fans_total","status"], "page_length": 20}),
        ("内容生产屏", "bar", {"groupby": "dept", "metric": "sum__works_total"}),
        ("全量账号屏", "table", {"columns": ["account_name","dept","person","plays_inc","fans_total","fans_inc","status"]}),
        ("部门趋势屏", "bar", {"groupby": "dept", "metrics": ["sum__plays_inc", "sum__works_total"], "stacked": True}),
        ("地域分布屏", "pivot_table", {"groupby": ["dept"], "metrics": ["sum__fans_total", "sum__plays_inc"]}),
    ]
    chart_ids = []
    for (name, vt, params) in charts:
        cid = create_chart(name, vt, ds_id, params)
        if cid > 0:
            chart_ids.append(cid)
    if chart_ids:
        create_dashboard("data-tw 大屏", chart_ids)
    print("[done]")


if __name__ == "__main__":
    main()