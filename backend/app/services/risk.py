from typing import Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.asset import Asset, AssetCriticality
from app.models.user import User
from app.models.relationship import Relationship


class RiskService:
    def __init__(self, db: Session):
        self.db = db

    def calculate_asset_risk(self, asset: Asset) -> float:
        criticality_scores = {
            AssetCriticality.CRITICAL: 100,
            AssetCriticality.HIGH: 75,
            AssetCriticality.MEDIUM: 50,
            AssetCriticality.LOW: 25,
        }
        criticality_score = criticality_scores.get(asset.criticality, 50)

        relationships = self.db.query(Relationship).filter(
            (Relationship.source_id == asset.id) | (Relationship.target_id == asset.id)
        ).all()

        exposure_score = min(len(relationships) * 10, 100)

        privileged_access = sum(
            1 for r in relationships
            if r.privilege_level in ["admin", "domain_admin", "local_admin"]
        )
        privilege_score = min(privileged_access * 15, 100)

        risk_score = (
            criticality_score * 0.3 +
            exposure_score * 0.3 +
            privilege_score * 0.4
        )

        return round(risk_score, 2)

    def calculate_user_risk(self, user: User) -> float:
        base_score = 50

        if user.is_domain_admin:
            base_score += 40
        elif user.is_admin:
            base_score += 25

        if user.is_service_account:
            base_score += 15

        if user.is_orphaned:
            base_score += 20

        if user.is_inactive:
            base_score -= 10

        relationships = self.db.query(Relationship).filter(
            Relationship.user_id == user.id
        ).all()

        access_score = min(len(relationships) * 5, 50)

        risk_score = min(base_score + access_score, 100)

        return round(risk_score, 2)

    def calculate_all_risks(self) -> Dict:
        assets = self.db.query(Asset).all()
        users = self.db.query(User).all()

        asset_risks = {}
        for asset in assets:
            risk = self.calculate_asset_risk(asset)
            asset.risk_score = risk
            asset_risks[asset.id] = {
                "hostname": asset.hostname,
                "ip_address": asset.ip_address,
                "risk_score": risk,
                "criticality": asset.criticality.value if asset.criticality else "medium",
            }

        user_risks = {}
        for user in users:
            risk = self.calculate_user_risk(user)
            user.risk_score = risk
            user_risks[user.id] = {
                "username": user.username,
                "risk_score": risk,
                "is_admin": user.is_admin,
            }

        self.db.commit()

        return {
            "assets": asset_risks,
            "users": user_risks,
            "summary": self._calculate_summary(asset_risks, user_risks),
        }

    def _calculate_summary(self, asset_risks: Dict, user_risks: Dict) -> Dict:
        all_scores = []
        for asset_data in asset_risks.values():
            all_scores.append(asset_data["risk_score"])
        for user_data in user_risks.values():
            all_scores.append(user_data["risk_score"])

        if not all_scores:
            return {
                "overall_risk": 0,
                "risk_level": "low",
                "critical_assets": 0,
                "high_risk_users": 0,
            }

        overall_risk = sum(all_scores) / len(all_scores)

        critical_assets = sum(
            1 for a in asset_risks.values()
            if a["risk_score"] >= 76
        )

        high_risk_users = sum(
            1 for u in user_risks.values()
            if u["risk_score"] >= 76
        )

        risk_level = self._get_risk_level(overall_risk)

        return {
            "overall_risk": round(overall_risk, 2),
            "risk_level": risk_level,
            "critical_assets": critical_assets,
            "high_risk_users": high_risk_users,
            "total_assets": len(asset_risks),
            "total_users": len(user_risks),
        }

    def _get_risk_level(self, score: float) -> str:
        if score <= 25:
            return "low"
        elif score <= 50:
            return "medium"
        elif score <= 75:
            return "high"
        else:
            return "critical"

    def get_risk_summary(self) -> Dict:
        assets = self.db.query(Asset).all()
        users = self.db.query(User).all()

        criticality_distribution = {}
        for asset in assets:
            crit = asset.criticality.value if asset.criticality else "unknown"
            criticality_distribution[crit] = criticality_distribution.get(crit, 0) + 1

        admin_users = sum(1 for u in users if u.is_admin)
        domain_admins = sum(1 for u in users if u.is_domain_admin)
        service_accounts = sum(1 for u in users if u.is_service_account)
        orphaned_accounts = sum(1 for u in users if u.is_orphaned)

        return {
            "asset_count": len(assets),
            "user_count": len(users),
            "criticality_distribution": criticality_distribution,
            "privileged_accounts": {
                "admin_users": admin_users,
                "domain_admins": domain_admins,
                "service_accounts": service_accounts,
                "orphaned_accounts": orphaned_accounts,
            },
            "risk_score_range": {
                "min": min((a.risk_score or 0 for a in assets), default=0),
                "max": max((a.risk_score or 0 for a in assets), default=0),
                "avg": sum((a.risk_score or 0 for a in assets)) / len(assets) if assets else 0,
            },
        }
