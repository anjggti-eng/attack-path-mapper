from pysnmp.hlapi import *
from typing import List, Dict, Optional


class SNMPCollector:
    def __init__(self):
        self.community = "public"

    def get_system_info(self, host: str, community: str = None) -> Dict:
        community = community or self.community

        oids = {
            "sysDescr": "1.3.6.1.2.1.1.1.0",
            "sysObjectID": "1.3.6.1.2.1.1.2.0",
            "sysUpTime": "1.3.6.1.2.1.1.3.0",
            "sysContact": "1.3.6.1.2.1.1.4.0",
            "sysName": "1.3.6.1.2.1.1.5.0",
            "sysLocation": "1.3.6.1.2.1.1.6.0",
        }

        result = {}
        for name, oid in oids.items():
            value = self._get_oid(host, community, oid)
            if value is not None:
                result[name] = value

        return result

    def get_interfaces(self, host: str, community: str = None) -> List[Dict]:
        community = community or self.community
        interfaces = []

        if_table = "1.3.6.1.2.1.2.2.1"
        if_number = self._get_oid(host, community, "1.3.6.1.2.1.2.1.0")

        if if_number:
            for i in range(1, int(if_number) + 1):
                iface = {
                    "index": i,
                    "descr": self._get_oid(host, community, f"{if_table}.2.{i}") or "",
                    "type": self._get_oid(host, community, f"{if_table}.3.{i}") or 0,
                    "mtu": self._get_oid(host, community, f"{if_table}.4.{i}") or 0,
                    "speed": self._get_oid(host, community, f"{if_table}.5.{i}") or 0,
                    "mac": self._get_oid(host, community, f"{if_table}.6.{i}") or "",
                    "status": self._get_oid(host, community, f"{if_table}.7.{i}") or 0,
                    "ip": self._get_ip_address(host, community, i),
                }
                interfaces.append(iface)

        return interfaces

    def get_routing_table(self, host: str, community: str = None) -> List[Dict]:
        community = community or self.community
        routes = []

        ip_route_table = "1.3.6.1.2.1.4.21.1"

        for oid, value in self._walk(host, community, ip_route_table):
            parts = oid.split(".")
            dest = ".".join(parts[-4:])
            route = {
                "destination": dest,
                "mask": self._get_oid(host, community, f"{ip_route_table}.11.{dest}") or "",
                "next_hop": self._get_oid(host, community, f"{ip_route_table}.7.{dest}") or "",
                "interface": self._get_oid(host, community, f"{ip_route_table}.2.{dest}") or "",
            }
            routes.append(route)

        return routes

    def get_arp_table(self, host: str, community: str = None) -> List[Dict]:
        community = community or self.community
        arp_entries = []

        ip_net_to_media = "1.3.6.1.2.1.4.22.1"

        for oid, value in self._walk(host, community, ip_net_to_media):
            parts = oid.split(".")
            index = parts[-1]
            entry = {
                "interface": self._get_oid(host, community, f"{ip_net_to_media}.2.{index}") or "",
                "mac": self._get_oid(host, community, f"{ip_net_to_media}.3.{index}") or "",
                "ip": self._get_oid(host, community, f"{ip_net_to_media}.4.{index}") or "",
                "type": self._get_oid(host, community, f"{ip_net_to_media}.5.{index}") or 0,
            }
            arp_entries.append(entry)

        return arp_entries

    def get_switch_ports(self, host: str, community: str = None) -> List[Dict]:
        community = community or self.community
        ports = []

        if_table = "1.3.6.1.2.1.2.2.1"

        for i in range(1, 100):
            descr = self._get_oid(host, community, f"{if_table}.2.{i}")
            if not descr:
                break

            port = {
                "index": i,
                "descr": descr,
                "status": self._get_oid(host, community, f"{if_table}.7.{i}") or 0,
                "speed": self._get_oid(host, community, f"{if_table}.5.{i}") or 0,
                "in_octets": self._get_oid(host, community, f"{if_table}.10.{i}") or 0,
                "out_octets": self._get_oid(host, community, f"{if_table}.16.{i}") or 0,
            }
            ports.append(port)

        return ports

    def _get_oid(self, host: str, community: str, oid: str) -> Optional[str]:
        try:
            error_indication, error_status, error_index, var_binds = next(
                getCmd(
                    SnmpEngine(),
                    CommunityData(community),
                    UdpTransportTarget((host, 161), timeout=5, retries=2),
                    ContextData(),
                    ObjectType(ObjectIdentity(oid)),
                )
            )

            if error_indication:
                return None
            elif error_status:
                return None
            else:
                for var_bind in var_binds:
                    return str(var_bind[1])

        except Exception as e:
            return None

    def _walk(self, host: str, community: str, oid: str):
        results = []
        try:
            for (error_indication, error_status, error_index, var_binds) in nextCmd(
                SnmpEngine(),
                CommunityData(community),
                UdpTransportTarget((host, 161), timeout=5, retries=2),
                ContextData(),
                ObjectType(ObjectIdentity(oid)),
                lexicographicMode=False,
            ):
                if error_indication or error_status:
                    break
                for var_bind in var_binds:
                    results.append((str(var_bind[0]), str(var_bind[1])))
        except Exception:
            pass
        return results

    def _get_ip_address(self, host: str, community: str, if_index: int) -> str:
        ip_addr_table = "1.3.6.1.2.1.4.20.1"

        for oid, value in self._walk(host, community, ip_addr_table):
            if str(if_index) in oid:
                return value

        return ""
