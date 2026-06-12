from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Attack Path Mapper"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    DATABASE_URL: str = "postgresql://wa:wa_secret@127.0.0.1:5432/wa"
    DB_SCHEMA: str = "attackpath"
    NEO4J_URI: str = ""
    NEO4J_USER: str = ""
    NEO4J_PASSWORD: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "attack-path-mapper-secret-key-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS: List[str] = [
        "http://localhost:3001",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://192.168.3.122:3001",
    ]

    NMAP_SCAN_TIMEOUT: int = 300
    SNMP_COMMUNITY: str = "public"
    LDAP_BASE_DN: str = ""
    LDAP_DOMAIN: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
