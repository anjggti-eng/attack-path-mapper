from typing import List, Dict, Optional
from neo4j import GraphDatabase
import networkx as nx

from app.core.database import neo4j_conn
from app.models.asset import Asset
from app.models.user import User
from app.models.relationship import Relationship


class GraphService:
    def __init__(self):
        self.driver = neo4j_conn._driver

    def create_asset_node(self, asset: Asset):
        query = """
        MERGE (a:Asset {id: $id})
        SET a.hostname = $hostname,
            a.ip_address = $ip_address,
            a.asset_type = $asset_type,
            a.criticality = $criticality,
            a.function = $function,
            a.risk_score = $risk_score
        """
        neo4j_conn.execute_query(query, {
            "id": asset.id,
            "hostname": asset.hostname,
            "ip_address": asset.ip_address,
            "asset_type": asset.asset_type.value if asset.asset_type else "unknown",
            "criticality": asset.criticality.value if asset.criticality else "medium",
            "function": asset.function or "",
            "risk_score": asset.risk_score or 0,
        })

    def create_user_node(self, user: User):
        query = """
        MERGE (u:User {id: $id})
        SET u.username = $username,
            u.is_admin = $is_admin,
            u.is_domain_admin = $is_domain_admin,
            u.risk_score = $risk_score
        """
        neo4j_conn.execute_query(query, {
            "id": user.id,
            "username": user.username,
            "is_admin": user.is_admin or False,
            "is_domain_admin": user.is_domain_admin or False,
            "risk_score": user.risk_score or 0,
        })

    def create_relationship(self, relationship: Relationship):
        query = """
        MATCH (source {id: $source_id})
        MATCH (target {id: $target_id})
        MERGE (source)-[r:CONNECTS_TO]->(target)
        SET r.relation_type = $relation_type,
            r.privilege_level = $privilege_level,
            r.protocol = $protocol,
            r.port = $port,
            r.risk_score = $risk_score
        """
        neo4j_conn.execute_query(query, {
            "source_id": relationship.source_id,
            "target_id": relationship.target_id,
            "relation_type": relationship.relation_type or "connects_to",
            "privilege_level": relationship.privilege_level or "user",
            "protocol": relationship.protocol or "",
            "port": relationship.port or 0,
            "risk_score": relationship.risk_score or 0,
        })

    def find_attack_paths(self, source_id: int, target_id: int) -> List[Dict]:
        query = """
        MATCH path = shortestPath(
            (source {id: $source_id})-[*]-(target {id: $target_id})
        )
        RETURN [n IN nodes(path) | {
            id: n.id,
            label: COALESCE(n.hostname, n.username, 'Unknown'),
            type: COALESCE(n.asset_type, 'User'),
            criticality: COALESCE(n.criticality, 'medium'),
            risk_score: COALESCE(n.risk_score, 0)
        }] AS nodes,
        [r IN relationships(path) | {
            type: type(r),
            relation_type: r.relation_type,
            privilege_level: r.privilege_level,
            risk_score: r.risk_score
        }] AS relationships,
        length(path) AS path_length
        """
        results = neo4j_conn.execute_query(query, {
            "source_id": source_id,
            "target_id": target_id,
        })
        return results

    def find_most_dangerous_path(self, source_id: int, target_id: int) -> Optional[Dict]:
        query = """
        MATCH path = allShortestPaths(
            (source {id: $source_id})-[*]-(target {id: $target_id})
        )
        RETURN [n IN nodes(path) | {
            id: n.id,
            label: COALESCE(n.hostname, n.username, 'Unknown'),
            type: COALESCE(n.asset_type, 'User'),
            criticality: COALESCE(n.criticality, 'medium'),
            risk_score: COALESCE(n.risk_score, 0)
        }] AS nodes,
        [r IN relationships(path) | {
            type: type(r),
            relation_type: r.relation_type,
            privilege_level: r.privilege_level,
            risk_score: r.risk_score
        }] AS relationships,
        reduce(risk = 0, r IN relationships(path) | risk + COALESCE(r.risk_score, 0)) AS total_risk
        ORDER BY total_risk DESC
        LIMIT 1
        """
        results = neo4j_conn.execute_query(query, {
            "source_id": source_id,
            "target_id": target_id,
        })
        return results[0] if results else None

    def find_all_paths(self, source_id: int, target_id: int, max_hops: int = 10) -> List[Dict]:
        query = """
        MATCH path = (source {id: $source_id})-[*1..$max_hops]-(target {id: $target_id})
        RETURN [n IN nodes(path) | {
            id: n.id,
            label: COALESCE(n.hostname, n.username, 'Unknown'),
            type: COALESCE(n.asset_type, 'User'),
            criticality: COALESCE(n.criticality, 'medium'),
            risk_score: COALESCE(n.risk_score, 0)
        }] AS nodes,
        [r IN relationships(path) | {
            type: type(r),
            relation_type: r.relation_type,
            privilege_level: r.privilege_level,
            risk_score: r.risk_score
        }] AS relationships,
        length(path) AS path_length,
        reduce(risk = 0, r IN relationships(path) | risk + COALESCE(r.risk_score, 0)) AS total_risk
        ORDER BY total_risk DESC
        """
        results = neo4j_conn.execute_query(query, {
            "source_id": source_id,
            "target_id": target_id,
            "max_hops": max_hops,
        })
        return results

    def get_critical_paths(self) -> List[Dict]:
        query = """
        MATCH path = (source)-[*]->(target)
        WHERE target.criticality IN ['critical', 'high']
        RETURN [n IN nodes(path) | {
            id: n.id,
            label: COALESCE(n.hostname, n.username, 'Unknown'),
            type: COALESCE(n.asset_type, 'User'),
            criticality: COALESCE(n.criticality, 'medium')
        }] AS nodes,
        [r IN relationships(path) | {
            type: type(r),
            relation_type: r.relation_type,
            privilege_level: r.privilege_level
        }] AS relationships,
        length(path) AS path_length
        ORDER BY length(path)
        LIMIT 20
        """
        return neo4j_conn.execute_query(query)

    def get_full_graph(self, include_assets: bool, include_users: bool, include_relationships: bool) -> Dict:
        nodes = []
        edges = []

        if include_assets:
            query = "MATCH (a:Asset) RETURN a.id AS id, a.hostname AS label, a.asset_type AS type, a.criticality AS criticality, a.risk_score AS risk_score"
            assets = neo4j_conn.execute_query(query)
            for asset in assets:
                nodes.append({
                    "data": {
                        "id": f"asset_{asset['id']}",
                        "label": asset["label"],
                        "type": asset["type"],
                        "criticality": asset["criticality"],
                        "risk_score": asset["risk_score"],
                    }
                })

        if include_users:
            query = "MATCH (u:User) RETURN u.id AS id, u.username AS label, u.is_admin AS is_admin, u.risk_score AS risk_score"
            users = neo4j_conn.execute_query(query)
            for user in users:
                nodes.append({
                    "data": {
                        "id": f"user_{user['id']}",
                        "label": user["label"],
                        "type": "user",
                        "is_admin": user["is_admin"],
                        "risk_score": user["risk_score"],
                    }
                })

        if include_relationships:
            query = """
            MATCH (source)-[r:CONNECTS_TO]->(target)
            RETURN source.id AS source_id, target.id AS target_id,
                   r.relation_type AS relation_type, r.privilege_level AS privilege_level,
                   r.risk_score AS risk_score
            """
            relationships = neo4j_conn.execute_query(query)
            for rel in relationships:
                source_type = "user" if "username" in str(rel.get("source_id")) else "asset"
                target_type = "user" if "username" in str(rel.get("target_id")) else "asset"
                edges.append({
                    "data": {
                        "source": f"{source_type}_{rel['source_id']}",
                        "target": f"{target_type}_{rel['target_id']}",
                        "relation_type": rel["relation_type"],
                        "privilege_level": rel["privilege_level"],
                        "risk_score": rel["risk_score"],
                    }
                })

        return {"nodes": nodes, "edges": edges}
