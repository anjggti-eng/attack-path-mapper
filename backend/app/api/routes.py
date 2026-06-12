from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from datetime import datetime
import nmap
import json

from app.core.config import settings
from app.core.database import engine, text

router = APIRouter()


def db_execute(query: str, params: dict = None, fetch: bool = True):
    with engine.connect() as conn:
        result = conn.execute(text(query), params or {})
        conn.commit()
        if fetch:
            return [dict(row._mapping) for row in result]
        return None


def db_fetchone(query: str, params: dict = None):
    with engine.connect() as conn:
        result = conn.execute(text(query), params or {})
        row = result.fetchone()
        return dict(row._mapping) if row else None


@router.get("/dashboard/stats")
def get_dashboard_stats():
    assets = db_execute("SELECT COUNT(*) as cnt FROM assets")
    users = db_execute("SELECT COUNT(*) as cnt FROM users")
    rels = db_execute("SELECT COUNT(*) as cnt FROM relationships")
    scans = db_execute("SELECT COUNT(*) as cnt FROM scans")
    crit = db_execute("SELECT COUNT(*) as cnt FROM assets WHERE criticality = 'critical'")
    admins = db_execute("SELECT COUNT(*) as cnt FROM users WHERE is_admin = true")
    return {
        "total_assets": assets[0]["cnt"],
        "total_users": users[0]["cnt"],
        "total_relationships": rels[0]["cnt"],
        "total_scans": scans[0]["cnt"],
        "critical_assets": crit[0]["cnt"],
        "admin_users": admins[0]["cnt"],
    }


@router.get("/assets")
def get_assets(skip: int = 0, limit: int = 200, asset_type: Optional[str] = None, criticality: Optional[str] = None):
    where = []
    params = {}
    if asset_type:
        where.append("asset_type = :asset_type")
        params["asset_type"] = asset_type
    if criticality:
        where.append("criticality = :criticality")
        params["criticality"] = criticality
    where_clause = " WHERE " + " AND ".join(where) if where else ""
    return db_execute(f"SELECT * FROM assets{where_clause} ORDER BY risk_score DESC LIMIT :limit OFFSET :skip", {**params, "limit": limit, "skip": skip})


@router.get("/assets/{asset_id}")
def get_asset(asset_id: int):
    asset = db_fetchone("SELECT * FROM assets WHERE id = :id", {"id": asset_id})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.post("/assets")
def create_asset(data: dict):
    fields = ["hostname", "ip_address", "mac_address", "asset_type", "operating_system", "os_version", "criticality", "function", "department", "location", "description", "risk_score"]
    present = {k: v for k, v in data.items() if k in fields and v is not None}
    cols = ", ".join(present.keys())
    vals = ", ".join(f":{k}" for k in present.keys())
    result = db_execute(f"INSERT INTO assets ({cols}) VALUES ({vals}) RETURNING *", present)
    return result[0] if result else {}


@router.put("/assets/{asset_id}")
def update_asset(asset_id: int, data: dict):
    fields = ["hostname", "ip_address", "mac_address", "asset_type", "operating_system", "os_version", "criticality", "function", "department", "location", "description", "risk_score"]
    present = {k: v for k, v in data.items() if k in fields and v is not None}
    if not present:
        raise HTTPException(status_code=400, detail="No fields to update")
    set_clause = ", ".join(f"{k} = :{k}" for k in present.keys())
    present["id"] = asset_id
    result = db_execute(f"UPDATE assets SET {set_clause}, updated_at = NOW() WHERE id = :id RETURNING *", present)
    if not result:
        raise HTTPException(status_code=404, detail="Asset not found")
    return result[0]


@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: int):
    db_execute("DELETE FROM assets WHERE id = :id", {"id": asset_id}, fetch=False)
    return {"deleted": True}


@router.get("/users")
def get_users(skip: int = 0, limit: int = 200, is_admin: Optional[bool] = None):
    where = []
    params = {}
    if is_admin is not None:
        where.append("is_admin = :is_admin")
        params["is_admin"] = is_admin
    where_clause = " WHERE " + " AND ".join(where) if where else ""
    return db_execute(f"SELECT * FROM users{where_clause} ORDER BY risk_score DESC LIMIT :limit OFFSET :skip", {**params, "limit": limit, "skip": skip})


@router.get("/users/{user_id}")
def get_user(user_id: int):
    user = db_fetchone("SELECT * FROM users WHERE id = :id", {"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/users")
def create_user(data: dict):
    fields = ["username", "full_name", "email", "domain", "is_admin", "is_domain_admin", "is_service_account", "is_orphaned", "is_inactive", "risk_score", "description"]
    present = {k: v for k, v in data.items() if k in fields and v is not None}
    cols = ", ".join(present.keys())
    vals = ", ".join(f":{k}" for k in present.keys())
    result = db_execute(f"INSERT INTO users ({cols}) VALUES ({vals}) RETURNING *", present)
    return result[0] if result else {}


@router.put("/users/{user_id}")
def update_user(user_id: int, data: dict):
    fields = ["username", "full_name", "email", "domain", "is_admin", "is_domain_admin", "is_service_account", "is_orphaned", "is_inactive", "risk_score", "description"]
    present = {k: v for k, v in data.items() if k in fields and v is not None}
    if not present:
        raise HTTPException(status_code=400, detail="No fields to update")
    set_clause = ", ".join(f"{k} = :{k}" for k in present.keys())
    present["id"] = user_id
    result = db_execute(f"UPDATE users SET {set_clause}, updated_at = NOW() WHERE id = :id RETURNING *", present)
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return result[0]


@router.delete("/users/{user_id}")
def delete_user(user_id: int):
    db_execute("DELETE FROM users WHERE id = :id", {"id": user_id}, fetch=False)
    return {"deleted": True}


@router.get("/groups")
def get_groups(skip: int = 0, limit: int = 200):
    return db_execute("SELECT * FROM groups ORDER BY name LIMIT :limit OFFSET :skip", {"limit": limit, "skip": skip})


@router.post("/groups")
def create_group(data: dict):
    fields = ["name", "domain", "description", "is_domain_admin", "is_privileged"]
    present = {k: v for k, v in data.items() if k in fields and v is not None}
    cols = ", ".join(present.keys())
    vals = ", ".join(f":{k}" for k in present.keys())
    result = db_execute(f"INSERT INTO groups ({cols}) VALUES ({vals}) RETURNING *", present)
    return result[0] if result else {}


@router.get("/relationships")
def get_relationships(skip: int = 0, limit: int = 500, source_id: Optional[int] = None, target_id: Optional[int] = None):
    where = []
    params = {}
    if source_id:
        where.append("source_id = :source_id")
        params["source_id"] = source_id
    if target_id:
        where.append("target_id = :target_id")
        params["target_id"] = target_id
    where_clause = " WHERE " + " AND ".join(where) if where else ""
    return db_execute(f"SELECT * FROM relationships{where_clause} ORDER BY id LIMIT :limit OFFSET :skip", {**params, "limit": limit, "skip": skip})


@router.post("/relationships")
def create_relationship(data: dict):
    fields = ["source_id", "target_id", "user_id", "relation_type", "privilege_level", "protocol", "port", "risk_score", "description", "evidence"]
    present = {k: v for k, v in data.items() if k in fields and v is not None}
    cols = ", ".join(present.keys())
    vals = ", ".join(f":{k}" for k in present.keys())
    result = db_execute(f"INSERT INTO relationships ({cols}) VALUES ({vals}) RETURNING *", present)
    return result[0] if result else {}


@router.delete("/relationships/{rel_id}")
def delete_relationship(rel_id: int):
    db_execute("DELETE FROM relationships WHERE id = :id", {"id": rel_id}, fetch=False)
    return {"deleted": True}


@router.get("/scans")
def get_scans(skip: int = 0, limit: int = 100):
    return db_execute("SELECT * FROM scans ORDER BY created_at DESC LIMIT :limit OFFSET :skip", {"limit": limit, "skip": skip})


@router.get("/scans/{scan_id}")
def get_scan(scan_id: int):
    scan = db_fetchone("SELECT * FROM scans WHERE id = :id", {"id": scan_id})
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.post("/scans")
def start_scan(data: dict, background_tasks: BackgroundTasks):
    name = data.get("name", "Varredura")
    scan_type = data.get("scan_type", "full")
    target_range = data.get("target_range", "127.0.0.1")

    result = db_execute(
        "INSERT INTO scans (name, scan_type, status, target_range) VALUES (:name, :scan_type, 'running', :target_range) RETURNING *",
        {"name": name, "scan_type": scan_type, "target_range": target_range},
    )
    scan = result[0] if result else {}

    background_tasks.add_task(run_nmap_scan, scan.get("id"), target_range, scan_type)

    return scan


def run_nmap_scan(scan_id: int, target_range: str, scan_type: str):
    try:
        db_execute(
            "UPDATE scans SET status = 'running', started_at = NOW() WHERE id = :id",
            {"id": scan_id},
            fetch=False,
        )

        nm = nmap.PortScanner()

        if scan_type == "quick":
            arguments = "-sn --top-ports 100"
        elif scan_type == "targeted":
            arguments = "-sV -O --top-ports 1000"
        else:
            arguments = "-sV -O -sn --top-ports 1000"

        nm.scan(hosts=target_range, arguments=arguments)

        assets_found = 0
        rels_found = 0

        for host in nm.all_hosts():
            host_data = nm[host]
            hostname = host_data.hostname() if "hostname" in host_data and host_data.hostname() else host

            os_info = ""
            if "osmatch" in host_data and host_data["osmatch"]:
                os_info = host_data["osmatch"][0].get("name", "")

            asset_type = "computer"
            criticality = "medium"
            function = "Estação de Trabalho"

            if "tcp" in host_data:
                ports = set(host_data["tcp"].keys())
                if 389 in ports or 636 in ports:
                    asset_type = "server"
                    criticality = "critical"
                    function = "Controlador de Domínio"
                elif 1433 in ports or 5432 in ports or 3306 in ports:
                    asset_type = "server"
                    criticality = "high"
                    function = "Servidor de Banco de Dados"
                elif 80 in ports or 443 in ports:
                    asset_type = "server"
                    criticality = "medium"
                    function = "Servidor Web"
                elif 22 in ports:
                    asset_type = "server"
                    criticality = "medium"
                    function = "Servidor SSH"
                elif 3389 in ports:
                    asset_type = "computer"
                    criticality = "medium"
                    function = "Estação de Trabalho"

            risk_score = 50
            if criticality == "critical":
                risk_score = 90
            elif criticality == "high":
                risk_score = 70

            existing = db_fetchone("SELECT id FROM assets WHERE ip_address = :ip", {"ip": host})
            if existing:
                db_execute(
                    "UPDATE assets SET hostname = :hostname, os_version = :os, last_scan = NOW(), updated_at = NOW() WHERE ip_address = :ip",
                    {"hostname": hostname, "os": os_info, "ip": host},
                    fetch=False,
                )
            else:
                db_execute(
                    "INSERT INTO assets (hostname, ip_address, asset_type, os_version, criticality, function, risk_score, last_scan) VALUES (:hostname, :ip, :type, :os, :crit, :func, :risk, NOW())",
                    {"hostname": hostname, "ip": host, "type": asset_type, "os": os_info, "crit": criticality, "func": function, "risk": risk_score},
                    fetch=False,
                )
                assets_found += 1

            if "tcp" in host_data:
                for port, port_info in host_data["tcp"].items():
                    if port in [445, 139, 3389, 22, 389, 636]:
                        src_asset = db_fetchone("SELECT id FROM assets WHERE ip_address = :ip", {"ip": host})
                        if src_asset:
                            proto_map = {445: "SMB", 139: "SMB", 3389: "RDP", 22: "SSH", 389: "LDAP", 636: "LDAPS"}
                            rel_type = "has_access"
                            priv = "user"
                            if port in [389, 636]:
                                rel_type = "domain_access"
                                priv = "admin"

                            existing_rel = db_fetchone(
                                "SELECT id FROM relationships WHERE source_id = :src AND protocol = :proto AND port = :port",
                                {"src": src_asset["id"], "proto": proto_map.get(port, "TCP"), "port": port},
                            )
                            if not existing_rel:
                                db_execute(
                                    "INSERT INTO relationships (source_id, target_id, relation_type, privilege_level, protocol, port, risk_score) VALUES (:src, :tgt, :type, :priv, :proto, :port, :risk)",
                                    {"src": src_asset["id"], "tgt": src_asset["id"], "type": rel_type, "priv": priv, "proto": proto_map.get(port, "TCP"), "port": port, "risk": 60 if port in [389, 636] else 40},
                                    fetch=False,
                                )
                                rels_found += 1

        db_execute(
            "UPDATE scans SET status = 'completed', completed_at = NOW(), assets_found = :assets, relationships_found = :rels WHERE id = :id",
            {"id": scan_id, "assets": assets_found, "rels": rels_found},
            fetch=False,
        )

    except Exception as e:
        db_execute(
            "UPDATE scans SET status = 'failed', error_message = :err, completed_at = NOW() WHERE id = :id",
            {"id": scan_id, "err": str(e)},
            fetch=False,
        )


@router.get("/graph")
def get_graph_data():
    assets = db_execute("SELECT id, hostname, ip_address, asset_type, criticality, function, risk_score FROM assets")
    users = db_execute("SELECT id, username, is_admin, is_domain_admin, risk_score FROM users")
    rels = db_execute("SELECT source_id, target_id, user_id, relation_type, privilege_level, protocol, port, risk_score FROM relationships")

    nodes = []
    for a in assets:
        nodes.append({
            "data": {
                "id": f"asset_{a['id']}",
                "label": a["hostname"] or a["ip_address"],
                "type": a["asset_type"],
                "criticality": a["criticality"],
                "risk_score": a["risk_score"],
                "function": a["function"],
            }
        })
    for u in users:
        nodes.append({
            "data": {
                "id": f"user_{u['id']}",
                "label": u["username"],
                "type": "user",
                "criticality": "high" if u["is_domain_admin"] else ("medium" if u["is_admin"] else "low"),
                "risk_score": u["risk_score"],
            }
        })

    edges = []
    for r in rels:
        src = f"asset_{r['source_id']}" if r["source_id"] else None
        tgt = f"asset_{r['target_id']}" if r["target_id"] else None
        if r["user_id"]:
            src = f"user_{r['user_id']}"
        if src and tgt and src != tgt:
            edges.append({
                "data": {
                    "source": src,
                    "target": tgt,
                    "relation_type": r["relation_type"],
                    "privilege_level": r["privilege_level"],
                    "risk_score": r["risk_score"],
                }
            })

    return {"nodes": nodes, "edges": edges}


@router.post("/attack-paths/analyze")
def analyze_attack_paths(data: dict):
    source_id = data.get("source_id")
    target_id = data.get("target_id")
    if not source_id or not target_id:
        raise HTTPException(status_code=400, detail="source_id and target_id required")

    source = db_fetchone("SELECT * FROM assets WHERE id = :id", {"id": source_id})
    target = db_fetchone("SELECT * FROM assets WHERE id = :id", {"id": target_id})
    if not source or not target:
        raise HTTPException(status_code=404, detail="Source or target asset not found")

    rels = db_execute("SELECT * FROM relationships")
    assets = db_execute("SELECT id, hostname, asset_type, criticality, risk_score FROM assets")

    adj = {}
    for a in assets:
        adj[f"asset_{a['id']}"] = {"label": a["hostname"], "type": a["asset_type"], "criticality": a["criticality"], "risk_score": a["risk_score"], "neighbors": []}
    for r in rels:
        src = f"asset_{r['source_id']}"
        tgt = f"asset_{r['target_id']}"
        if src in adj and tgt in adj:
            adj[src]["neighbors"].append({"id": tgt, "risk": r["risk_score"], "type": r["relation_type"]})

    start = f"asset_{source_id}"
    end = f"asset_{target_id}"

    queue = [[start]]
    visited = {start}
    paths = []

    while queue:
        path = queue.pop(0)
        current = path[-1]

        if current == end:
            path_data = []
            total_risk = 0
            for node_id in path:
                info = adj[node_id]
                path_data.append({"id": node_id, "label": info["label"], "type": info["type"]})
            for i in range(len(path) - 1):
                for n in adj[path[i]]["neighbors"]:
                    if n["id"] == path[i + 1]:
                        total_risk += n["risk"]
                        break
            paths.append({"path": path_data, "hops": len(path) - 1, "total_risk": total_risk})
            continue

        for neighbor in adj.get(current, {}).get("neighbors", []):
            nid = neighbor["id"]
            if nid not in visited:
                visited.add(nid)
                queue.append(path + [nid])

    paths.sort(key=lambda x: x["total_risk"], reverse=True)

    if paths:
        db_execute(
            "INSERT INTO attack_paths (name, source_asset_id, target_asset_id, path_type, path_steps, total_risk_score, hop_count, description) VALUES (:name, :src, :tgt, 'shortest', :steps, :risk, :hops, :desc)",
            {
                "name": f"Caminho {source['hostname']} → {target['hostname']}",
                "src": source_id,
                "tgt": target_id,
                "steps": json.dumps(paths[0]["path"]),
                "risk": paths[0]["total_risk"],
                "hops": paths[0]["hops"],
                "desc": f"Caminho de ataque de {source['hostname']} até {target['hostname']}",
            },
            fetch=False,
        )

    return {"paths": paths, "total_found": len(paths)}


@router.get("/attack-paths")
def get_attack_paths(skip: int = 0, limit: int = 100):
    return db_execute("SELECT * FROM attack_paths ORDER BY total_risk_score DESC LIMIT :limit OFFSET :skip", {"limit": limit, "skip": skip})


@router.get("/attack-paths/{path_id}")
def get_attack_path(path_id: int):
    path = db_fetchone("SELECT * FROM attack_paths WHERE id = :id", {"id": path_id})
    if not path:
        raise HTTPException(status_code=404, detail="Attack path not found")
    return path


@router.delete("/attack-paths/{path_id}")
def delete_attack_path(path_id: int):
    db_execute("DELETE FROM attack_paths WHERE id = :id", {"id": path_id}, fetch=False)
    return {"deleted": True}


@router.get("/risk/summary")
def get_risk_summary():
    assets = db_execute("SELECT * FROM assets")
    users = db_execute("SELECT * FROM users")

    total_assets = len(assets)
    total_users = len(users)

    crit_assets = sum(1 for a in assets if a.get("criticality") == "critical")
    high_assets = sum(1 for a in assets if a.get("criticality") == "high")
    admin_users = sum(1 for u in users if u.get("is_admin"))
    domain_admins = sum(1 for u in users if u.get("is_domain_admin"))
    orphaned = sum(1 for u in users if u.get("is_orphaned"))

    all_scores = [a["risk_score"] for a in assets if a.get("risk_score")] + [u["risk_score"] for u in users if u.get("risk_score")]
    overall = sum(all_scores) / len(all_scores) if all_scores else 0

    risk_level = "low"
    if overall >= 76:
        risk_level = "critical"
    elif overall >= 51:
        risk_level = "high"
    elif overall >= 26:
        risk_level = "medium"

    return {
        "overall_risk": round(overall, 1),
        "risk_level": risk_level,
        "total_assets": total_assets,
        "total_users": total_users,
        "critical_assets": crit_assets,
        "high_assets": high_assets,
        "admin_users": admin_users,
        "domain_admins": domain_admins,
        "orphaned_accounts": orphaned,
    }


@router.post("/risk/calculate")
def calculate_risks():
    assets = db_execute("SELECT * FROM assets")
    for asset in assets:
        score = 50
        if asset.get("criticality") == "critical":
            score = 90
        elif asset.get("criticality") == "high":
            score = 70
        elif asset.get("criticality") == "low":
            score = 20

        rels = db_execute("SELECT COUNT(*) as cnt FROM relationships WHERE source_id = :id OR target_id = :id", {"id": asset["id"]})
        score += min(rels[0]["cnt"] * 5, 30)
        score = min(score, 100)

        db_execute("UPDATE assets SET risk_score = :score WHERE id = :id", {"score": score, "id": asset["id"]}, fetch=False)

    users = db_execute("SELECT * FROM users")
    for user in users:
        score = 50
        if user.get("is_domain_admin"):
            score += 40
        elif user.get("is_admin"):
            score += 25
        if user.get("is_service_account"):
            score += 15
        if user.get("is_orphaned"):
            score += 20
        score = min(score, 100)

        db_execute("UPDATE users SET risk_score = :score WHERE id = :id", {"score": score, "id": user["id"]}, fetch=False)

    return {"status": "calculated"}
