import nmap
from typing import List, Dict, Optional


class NmapCollector:
    def __init__(self):
        self.nm = nmap.PortScanner()

    def scan_host(self, host: str, ports: str = "1-1000", arguments: str = "") -> Dict:
        try:
            default_args = f"-sV -O --top-ports {ports}"
            if arguments:
                default_args += f" {arguments}"

            self.nm.scan(hosts=host, arguments=default_args)

            if host not in self.nm.all_hosts():
                return {"error": "Host not found"}

            return self._parse_host(host)

        except Exception as e:
            return {"error": str(e)}

    def scan_network(self, network: str, arguments: str = "-sn") -> List[Dict]:
        try:
            self.nm.scan(hosts=network, arguments=arguments)
            hosts = []

            for host in self.nm.all_hosts():
                hosts.append(self._parse_host(host))

            return hosts

        except Exception as e:
            return [{"error": str(e)}]

    def scan_ports(self, host: str, ports: str = "1-1000") -> Dict:
        try:
            self.nm.scan(hosts=host, arguments=f"-sV -p {ports}")

            if host not in self.nm.all_hosts():
                return {"error": "Host not found"}

            return self._parse_ports(host)

        except Exception as e:
            return {"error": str(e)}

    def detect_os(self, host: str) -> Dict:
        try:
            self.nm.scan(hosts=host, arguments="-O")

            if host not in self.nm.all_hosts():
                return {"error": "Host not found"}

            host_data = self.nm[host]
            os_matches = []

            if "osmatch" in host_data:
                for match in host_data["osmatch"]:
                    os_matches.append({
                        "name": match.get("name", ""),
                        "accuracy": match.get("accuracy", 0),
                    })

            return {
                "host": host,
                "os_matches": os_matches,
            }

        except Exception as e:
            return {"error": str(e)}

    def scan_services(self, host: str, ports: str = "1-65535") -> List[Dict]:
        try:
            self.nm.scan(hosts=host, arguments=f"-sV -p {ports}")

            if host not in self.nm.all_hosts():
                return []

            return self._parse_services(host)

        except Exception as e:
            return [{"error": str(e)}]

    def scan_vulnerabilities(self, host: str) -> List[Dict]:
        try:
            self.nm.scan(hosts=host, arguments="--script vuln")

            if host not in self.nm.all_hosts():
                return []

            vulnerabilities = []
            host_data = self.nm[host]

            if "script" in host_data:
                for script_name, output in host_data["script"].items():
                    vulnerabilities.append({
                        "script": script_name,
                        "output": output,
                    })

            return vulnerabilities

        except Exception as e:
            return [{"error": str(e)}]

    def _parse_host(self, host: str) -> Dict:
        host_data = self.nm[host]

        result = {
            "ip": host,
            "hostname": host_data.hostname() if "hostname" in host_data else host,
            "state": host_data.state(),
            "protocols": [],
            "os": [],
            "services": [],
        }

        for proto in host_data.all_protocols():
            result["protocols"].append(proto)
            ports = host_data[proto].keys()
            for port in sorted(ports):
                service = host_data[proto][port]
                result["services"].append({
                    "port": port,
                    "protocol": proto,
                    "state": service.get("state", ""),
                    "name": service.get("name", ""),
                    "product": service.get("product", ""),
                    "version": service.get("version", ""),
                })

        if "osmatch" in host_data:
            for match in host_data["osmatch"]:
                result["os"].append({
                    "name": match.get("name", ""),
                    "accuracy": match.get("accuracy", 0),
                })

        return result

    def _parse_ports(self, host: str) -> Dict:
        host_data = self.nm[host]
        ports = []

        for proto in host_data.all_protocols():
            for port in sorted(host_data[proto].keys()):
                service = host_data[proto][port]
                ports.append({
                    "port": port,
                    "protocol": proto,
                    "state": service.get("state", ""),
                    "name": service.get("name", ""),
                    "product": service.get("product", ""),
                    "version": service.get("version", ""),
                })

        return {
            "host": host,
            "ports": ports,
        }

    def _parse_services(self, host: str) -> List[Dict]:
        host_data = self.nm[host]
        services = []

        for proto in host_data.all_protocols():
            for port in sorted(host_data[proto].keys()):
                service = host_data[proto][port]
                services.append({
                    "port": port,
                    "protocol": proto,
                    "state": service.get("state", ""),
                    "name": service.get("name", ""),
                    "product": service.get("product", ""),
                    "version": service.get("version", ""),
                    "extra_info": service.get("extrainfo", ""),
                })

        return services
