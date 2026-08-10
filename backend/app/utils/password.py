import re

MIN_PASSWORD_LENGTH = 8

PASSWORD_PATTERN = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$"
)


def validate_password_strength(password: str) -> str:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError("Password must be at least 8 characters long.")
    if not PASSWORD_PATTERN.match(password):
        raise ValueError(
            "Password must contain at least one uppercase letter, "
            "one lowercase letter, and one number."
        )
    return password
