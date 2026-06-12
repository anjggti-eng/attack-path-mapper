import nmap
import subprocess
import json
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from app.models.asset import Asset, AssetType, AssetCriticality
from app.models.user import User
from app.models.group import Group
from app.models.relationship import Relationship
from app.models.scan import Scan, ScanStatus


class DiscoveryService:
    def __init__(self, db: Session):
        self.db = db
        self.nm = nmap.PortScanner()

    def run_scan(self, scan_id: int):
        scan = self.db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return

        scan.status = ScanStatus.RUNNING
        scan.started_at = datetime.utcnow()
        self.db.commit()

        try:
            if scan.scan_type == "full":
                self._full_discovery(scan)
            elif scan.scan_type == "quick":
                self._quick_discovery(scan)
            elif scan.scan_type == "targeted":
                self._targeted_discovery(scan, scan.target_range)

            scan.status = ScanStatus.COMPLETED
            scan.completed_at = datetime.utcnow()
            self.db.commit()

        except Exception as e:
            scan.status = ScanStatus.FAILED
            scan.error_message = str(e)
            scan.completed_at = datetime.utcnow()
            self.db.commit()

    def _full_discovery(self, scan: Scan):
        target_range = scan.target_range or "10.0.0.0/24"

        self.nm.scan(hosts=target_range, arguments="-sV -O -sn --top-ports 1000")

        for host in self.nm.all_hosts():
            asset = self._create_asset_from_host(host, scan.id)
            if asset:
                scan.assets_found += 1

        self._discover_ad_users(scan)
        self._discover_shares(scan)
        self._discover_relationships(scan)

        self.db.commit()

    def _quick_discovery(self, scan: Scan):
        target_range = scan.target_range or "10.0.0.0/24"
        self.nm.scan(hosts=target_range, arguments="-sn --top-ports 100")

        for host in self.nm.all_hosts():
            asset = self._create_asset_from_host(host, scan.id)
            if asset:
                scan.assets_found += 1

        self.db.commit()

    def _targeted_discovery(self, scan: Scan, target: str):
        self.nm.scan(hosts=target, arguments="-sV -O --top-ports 1000")

        for host in self.nm.all_hosts():
            asset = self._create_asset_from_host(host, scan.id)
            if asset:
                scan.assets_found += 1

        self._discover_relationships(scan)
        self.db.commit()

    def _create_asset_from_host(self, host: str, scan_id: int) -> Optional[Asset]:
        if host in self.nm.all_hosts():
            host_data = self.nm[host]

            hostname = host_data.hostname() if "hostname" in host_data else host
            ip_address = host

            os_info = {}
            if "osmatch" in host_data and host_data["osmatch"]:
                os_match = host_data["osmatch"][0]
                os_info["name"] = os_match.get("name", "Unknown")
                os_info["accuracy"] = os_match.get("accuracy", 0)

            asset_type = self._determine_asset_type(host_data)
            criticality = self._determine_criticality(host_data, asset_type)

            existing = self.db.query(Asset).filter(Asset.ip_address == ip_address).first()
            if existing:
                existing.hostname = hostname
                existing.os_version = os_info.get("name", "")
                existing.last_scan = datetime.utcnow()
                self.db.commit()
                return existing

            asset = Asset(
                hostname=hostname,
                ip_address=ip_address,
                asset_type=asset_type,
                os_version=os_info.get("name", ""),
                criticality=criticality,
                function=self._determine_function(host_data),
                last_scan=datetime.utcnow(),
            )
            self.db.add(asset)
            self.db.commit()
            self.db.refresh(asset)
            return asset

        return None

    def _determine_asset_type(self, host_data: dict) -> AssetType:
        if "osmatch" in host_data and host_data["osmatch"]:
            os_name = host_data["osmatch"][0].get("name", "").lower()
            if "server" in os_name or "windows server" in os_name:
                return AssetType.SERVER
            elif "router" in os_name or "cisco" in os_name:
                return AssetType.ROUTER
            elif "switch" in os_name:
                return AssetType.SWITCH
            elif "firewall" in os_name or "paloalto" in os_name:
                return AssetType.FIREWALL

        if "tcp" in host_data:
            ports = host_data["tcp"].keys()
            if 3389 in ports:
                return AssetType.COMPUTER
            if 22 in ports and 80 in ports:
                return AssetType.SERVER

        return AssetType.COMPUTER

    def _determine_criticality(self, host_data: dict, asset_type: AssetType) -> AssetCriticality:
        if asset_type == AssetType.SERVER:
            return AssetCriticality.HIGH
        if asset_type == AssetType.FIREWALL:
            return AssetCriticality.CRITICAL
        if asset_type == AssetType.ROUTER:
            return AssetCriticality.HIGH

        if "tcp" in host_data:
            ports = host_data["tcp"].keys()
            if 389 in ports or 636 in ports:
                return AssetCriticality.CRITICAL
            if 1433 in ports or 5432 in ports or 3306 in ports:
                return AssetCriticality.HIGH

        return AssetCriticality.MEDIUM

    def _determine_function(self, host_data: dict) -> str:
        if "tcp" in host_data:
            ports = set(host_data["tcp"].keys())
            if 389 in ports or 636 in ports:
                return "Controlador de Domínio"
            if 1433 in ports or 5432 in ports or 3306 in ports:
                return "Servidor de Banco de Dados"
            if 80 in ports or 443 in ports:
                return "Servidor Web"
            if 21 in ports:
                return "Servidor FTP"
            if 22 in ports:
                return "Servidor SSH"
        return "Estação de Trabalho"

    def _discover_ad_users(self, scan: Scan):
        try:
            result = subprocess.run(
                ["ldapsearch", "-x", "-h", scan.target_range or "localhost",
                 "-b", "DC=example,DC=com", "(objectClass=user)", "sAMAccountName"],
                capture_output=True,
                text=True,
                timeout=30,
            )

            if result.returncode == 0:
                for line in result.stdout.split("\n"):
                    if "sAMAccountName:" in line:
                        username = line.split("sAMAccountName:")[1].strip()
                        existing = self.db.query(User).filter(User.username == username).first()
                        if not existing:
                            user = User(
                                username=username,
                                domain="example.com",
                            )
                            self.db.add(user)
                self.db.commit()
        except Exception:
            pass

    def _discover_shares(self, scan: Scan):
        try:
            result = subprocess.run(
                ["smbclient", "-L", f"//{scan.target_range or 'localhost'}", "-N"],
                capture_output=True,
                text=True,
                timeout=30,
            )
        except Exception:
            pass

    def _discover_relationships(self, scan: Scan):
        assets = self.db.query(Asset).all()
        for asset in assets:
            relationships = self._analyze_connections(asset)
            for rel in relationships:
                existing = self.db.query(Relationship).filter(
                    Relationship.source_id == rel["source_id"],
                    Relationship.target_id == rel["target_id"],
                    Relationship.relation_type == rel["relation_type"],
                ).first()

                if not existing:
                    relationship = Relationship(**rel)
                    self.db.add(relationship)
                    scan.relationships_found += 1

        self.db.commit()

    def _analyze_connections(self, asset: Asset) -> List[dict]:
        relationships = []

        if "tcp" in self.nm[asset.ip_address] if asset.ip_address in self.nm.all_hosts() else {}:
            for port, port_info in self.nm[asset.ip_address].get("tcp", {}).items():
                if port == 445 or port == 139:
                    relationships.append({
                        "source_id": asset.id,
                        "target_id": asset.id,
                        "relation_type": "file_share",
                        "protocol": "SMB",
                        "port": port,
                    })

        return relationships
