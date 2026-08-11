"""Canonical amenity/service metadata so the API never depends on frontend icons."""

AMENITY_CATALOG: dict[str, tuple[str, str]] = {
    "parking": ("Car", "Parking"),
    "valet_parking": ("KeyRound", "Parking"),
    "ac": ("Snowflake", "Climate"),
    "air_conditioning": ("Snowflake", "Climate"),
    "power_backup": ("Zap", "Utilities"),
    "wifi": ("Wifi", "Connectivity"),
    "bridal_room": ("Gem", "Rooms"),
    "dining_hall": ("UtensilsCrossed", "Dining"),
    "stage": ("Mic2", "Event"),
    "decoration": ("PartyPopper", "Event"),
    "music": ("Music", "Entertainment"),
    "music_system": ("Music", "Entertainment"),
    "dj": ("Disc3", "Entertainment"),
    "catering": ("ChefHat", "Dining"),
    "projector": ("Projector", "AV"),
    "swimming_pool": ("Waves", "Recreation"),
    "garden": ("Trees", "Outdoor"),
    "wheelchair_access": ("Accessibility", "Accessibility"),
    "kids_area": ("Baby", "Recreation"),
}

SERVICE_ICONS: dict[str, str] = {
    "decorations": "PartyPopper",
    "dj": "Disc3",
    "catering": "ChefHat",
    "photography": "Camera",
    "makeup": "Sparkles",
    "host": "Users",
}


def amenity_meta(code: str, name: str) -> tuple[str, str]:
    key = (code or name).strip().lower().replace(" ", "_").replace("-", "_")
    if key in AMENITY_CATALOG:
        return AMENITY_CATALOG[key]
    for alias, meta in AMENITY_CATALOG.items():
        if alias in key or key in alias:
            return meta
    return ("Sparkles", "General")


def service_icon(code: str, name: str) -> str:
    key = (code or name).strip().lower().replace(" ", "_").replace("-", "_")
    return SERVICE_ICONS.get(key, "Layers")
