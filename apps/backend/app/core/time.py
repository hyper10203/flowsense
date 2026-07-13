"""UTC-safe time helpers for SQLite and API responses."""

from datetime import UTC, datetime


def as_utc(value: datetime) -> datetime:
    """Treat naive database values as UTC and return an aware UTC datetime."""
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def utc_iso(value: datetime) -> str:
    """Serialize a datetime as an unambiguous ISO-8601 UTC timestamp."""
    return as_utc(value).isoformat().replace("+00:00", "Z")
