import ldap
from typing import List, Dict, Optional
from datetime import datetime

from app.core.config import settings


class LDAPCollector:
    def __init__(self):
        self.connection = None

    def connect(self, server: str, port: int = 389, use_ssl: bool = False):
        try:
            protocol = "ldaps" if use_ssl else "ldap"
            self.connection = ldap.initialize(f"{protocol}://{server}:{port}")
            self.connection.set_option(ldap.OPT_REFERRALS, 0)
            return True
        except Exception as e:
            print(f"LDAP connection error: {e}")
            return False

    def authenticate(self, username: str, password: str, base_dn: str):
        try:
            self.connection.simple_bind_s(
                f"{username}@{settings.LDAP_DOMAIN}",
                password
            )
            return True
        except Exception as e:
            print(f"LDAP authentication error: {e}")
            return False

    def get_users(self, base_dn: str) -> List[Dict]:
        try:
            search_filter = "(objectClass=user)"
            attributes = [
                "sAMAccountName",
                "displayName",
                "mail",
                "memberOf",
                "lastLogon",
                "pwdLastSet",
                "userAccountControl",
            ]

            result_id = self.connection.search_s(
                base_dn,
                ldap.SCOPE_SUBTREE,
                search_filter,
                attributes,
            )

            users = []
            for dn, attrs in result_id:
                if dn:
                    user = {
                        "username": attrs.get("sAMAccountName", [b""])[0].decode("utf-8"),
                        "full_name": attrs.get("displayName", [b""])[0].decode("utf-8"),
                        "email": attrs.get("mail", [b""])[0].decode("utf-8"),
                        "groups": [
                            g.decode("utf-8") for g in attrs.get("memberOf", [])
                        ],
                        "last_login": self._parse_windows_time(
                            attrs.get("lastLogon", [b"0"])[0]
                        ),
                        "password_last_set": self._parse_windows_time(
                            attrs.get("pwdLastSet", [b"0"])[0]
                        ),
                        "is_disabled": self._is_disabled(
                            attrs.get("userAccountControl", [0])[0]
                        ),
                    }
                    users.append(user)

            return users

        except Exception as e:
            print(f"LDAP search error: {e}")
            return []

    def get_groups(self, base_dn: str) -> List[Dict]:
        try:
            search_filter = "(objectClass=group)"
            attributes = ["cn", "member", "description"]

            result_id = self.connection.search_s(
                base_dn,
                ldap.SCOPE_SUBTREE,
                search_filter,
                attributes,
            )

            groups = []
            for dn, attrs in result_id:
                if dn:
                    group = {
                        "name": attrs.get("cn", [b""])[0].decode("utf-8"),
                        "members": [
                            m.decode("utf-8") for m in attrs.get("member", [])
                        ],
                        "description": attrs.get("description", [b""])[0].decode("utf-8"),
                    }
                    groups.append(group)

            return groups

        except Exception as e:
            print(f"LDAP search error: {e}")
            return []

    def get_computers(self, base_dn: str) -> List[Dict]:
        try:
            search_filter = "(objectClass=computer)"
            attributes = [
                "cn",
                "dNSHostName",
                "operatingSystem",
                "operatingSystemVersion",
                "lastLogon",
            ]

            result_id = self.connection.search_s(
                base_dn,
                ldap.SCOPE_SUBTREE,
                search_filter,
                attributes,
            )

            computers = []
            for dn, attrs in result_id:
                if dn:
                    computer = {
                        "hostname": attrs.get("dNSHostName", [b""])[0].decode("utf-8"),
                        "name": attrs.get("cn", [b""])[0].decode("utf-8"),
                        "os": attrs.get("operatingSystem", [b""])[0].decode("utf-8"),
                        "os_version": attrs.get("operatingSystemVersion", [b""])[0].decode("utf-8"),
                    }
                    computers.append(computer)

            return computers

        except Exception as e:
            print(f"LDAP search error: {e}")
            return []

    def _parse_windows_time(self, windows_time: bytes) -> Optional[datetime]:
        try:
            timestamp = int.from_bytes(windows_time, byteorder="little")
            if timestamp == 0:
                return None
            return datetime.fromtimestamp(timestamp / 10000000 - 11644473600)
        except Exception:
            return None

    def _is_disabled(self, uac: int) -> bool:
        return bool(uac & 0x2)

    def disconnect(self):
        if self.connection:
            self.connection.unbind_s()
