"""
Phone number sanitization utilities for UAE/GCC regions.
Converts various phone formats to E.164 standard (+971XXXXXXXXX).
"""

import re
import phonenumbers
from phonenumbers import NumberParseException

# GCC country codes and their mobile prefixes
GCC_COUNTRIES = {
    "AE": "+971",  # UAE
    "SA": "+966",  # Saudi Arabia
    "QA": "+974",  # Qatar
    "BH": "+973",  # Bahrain
    "KW": "+965",  # Kuwait
    "OM": "+968",  # Oman
}

# UAE mobile prefixes (without country code)
UAE_MOBILE_PREFIXES = ["50", "52", "54", "55", "56", "58"]


def clean_phone_string(phone: str) -> str:
    """Remove all non-digit characters except leading +"""
    if not phone:
        return ""
    
    # Preserve leading + if present
    has_plus = phone.strip().startswith("+")
    
    # Remove all non-digits
    digits = re.sub(r"\D", "", phone)
    
    return f"+{digits}" if has_plus else digits


def detect_uae_number(digits: str) -> bool:
    """Check if the number looks like a UAE mobile number."""
    # Remove leading zeros
    digits = digits.lstrip("0")
    
    # Check for UAE patterns
    # 971XXXXXXXXX (with country code)
    if digits.startswith("971") and len(digits) == 12:
        return True
    
    # 5XXXXXXXX (UAE mobile without country code)
    if len(digits) == 9 and digits[:2] in UAE_MOBILE_PREFIXES:
        return True
    
    # 05XXXXXXXX (UAE mobile with leading 0)
    if len(digits) == 10 and digits[0] == "0" and digits[1:3] in UAE_MOBILE_PREFIXES:
        return True
    
    return False


def normalize_to_e164(phone: str, default_country: str = "AE") -> str:
    """
    Normalize a phone number to E.164 format.
    
    Args:
        phone: Raw phone number string
        default_country: ISO country code to assume if not detectable (default: UAE)
    
    Returns:
        E.164 formatted phone number (e.g., +971501234567)
        Empty string if parsing fails
    
    Examples:
        "050 123 4567" -> "+971501234567"
        "+971 50 123 4567" -> "+971501234567"
        "00971501234567" -> "+971501234567"
        "971501234567" -> "+971501234567"
    """
    if not phone:
        return ""
    
    # Clean the input
    cleaned = clean_phone_string(phone)
    
    if not cleaned:
        return ""
    
    # Handle numbers already in E.164 format
    if cleaned.startswith("+"):
        try:
            parsed = phonenumbers.parse(cleaned)
            if phonenumbers.is_valid_number(parsed):
                return phonenumbers.format_number(
                    parsed, phonenumbers.PhoneNumberFormat.E164
                )
        except NumberParseException:
            pass
    
    # Remove leading + for digit processing
    digits = cleaned.lstrip("+")
    
    # Handle 00 international prefix
    if digits.startswith("00"):
        digits = digits[2:]
    
    # Check if it already has a GCC country code
    for country, code in GCC_COUNTRIES.items():
        code_digits = code[1:]  # Remove +
        if digits.startswith(code_digits):
            try:
                parsed = phonenumbers.parse(f"+{digits}")
                if phonenumbers.is_valid_number(parsed):
                    return phonenumbers.format_number(
                        parsed, phonenumbers.PhoneNumberFormat.E164
                    )
            except NumberParseException:
                pass
    
    # If it looks like a UAE number, add UAE country code
    if detect_uae_number(digits):
        # Remove leading 0 if present
        digits = digits.lstrip("0")
        
        # If it doesn't start with 971, add it
        if not digits.startswith("971"):
            digits = f"971{digits}"
        
        try:
            parsed = phonenumbers.parse(f"+{digits}")
            if phonenumbers.is_valid_number(parsed):
                return phonenumbers.format_number(
                    parsed, phonenumbers.PhoneNumberFormat.E164
                )
        except NumberParseException:
            pass
    
    # Try parsing with default country
    try:
        parsed = phonenumbers.parse(cleaned, default_country)
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(
                parsed, phonenumbers.PhoneNumberFormat.E164
            )
    except NumberParseException:
        pass
    
    # Last resort: try to make a valid number
    digits = digits.lstrip("0")
    if len(digits) == 9 and digits[0] == "5":
        # Likely UAE mobile without country code
        return f"+971{digits}"
    
    return ""


def batch_normalize(phones: list[str], default_country: str = "AE") -> list[str]:
    """Normalize a list of phone numbers."""
    return [normalize_to_e164(p, default_country) for p in phones]


if __name__ == "__main__":
    # Test cases
    test_numbers = [
        "050 123 4567",
        "+971 50 123 4567",
        "00971501234567",
        "971501234567",
        "0501234567",
        "501234567",
        "+971501234567",
        "052-555-1234",
        "(050) 123-4567",
        "+966 50 123 4567",  # Saudi
        "invalid",
        "",
        None,
    ]
    
    print("Phone Number Normalization Test")
    print("=" * 50)
    for num in test_numbers:
        result = normalize_to_e164(num) if num else ""
        status = "✓" if result else "✗"
        print(f"{status} '{num}' -> '{result}'")
