"""
Country, timezone, and currency data for global locale support.

Sources:
- pycountry — ISO 3166 country data
- zoneinfo — IANA timezone database
- babel — CLDR currency names
"""

from functools import lru_cache

import pycountry
from babel import Locale
from babel.numbers import get_currency_name, get_currency_symbol


# Approximate country → primary currency mapping.
# Multi-currency countries use the most common one.
COUNTRY_CURRENCY_MAP: dict[str, str] = {
    "KE": "KES", "US": "USD", "GB": "GBP", "EU": "EUR",
    "DE": "EUR", "FR": "EUR", "IT": "EUR", "ES": "EUR",
    "NL": "EUR", "BE": "EUR", "AT": "EUR", "IE": "EUR",
    "PT": "EUR", "FI": "EUR", "GR": "EUR", "LU": "EUR",
    "CA": "CAD", "AU": "AUD", "NZ": "NZD", "JP": "JPY",
    "CN": "CNY", "IN": "INR", "BR": "BRL", "MX": "MXN",
    "ZA": "ZAR", "NG": "NGN", "GH": "GHS", "TZ": "TZS",
    "UG": "UGX", "RW": "RWF", "ET": "ETB", "EG": "EGP",
    "MA": "MAD", "DZ": "DZD", "TN": "TND", "SN": "XOF",
    "CI": "XOF", "CM": "XAF", "ZM": "ZMW", "ZW": "ZWL",
    "MW": "MWK", "MZ": "MZN", "AO": "AOA", "NA": "NAD",
    "BW": "BWP", "MU": "MUR", "SC": "SCR", "MG": "MGA",
    "CH": "CHF", "NO": "NOK", "SE": "SEK", "DK": "DKK",
    "PL": "PLN", "CZ": "CZK", "HU": "HUF", "RO": "RON",
    "BG": "BGN", "HR": "HRK", "RU": "RUB", "UA": "UAH",
    "TR": "TRY", "IL": "ILS", "SA": "SAR", "AE": "AED",
    "QA": "QAR", "KW": "KWD", "BH": "BHD", "OM": "OMR",
    "JO": "JOD", "LB": "LBP", "PK": "PKR", "BD": "BDT",
    "LK": "LKR", "NP": "NPR", "SG": "SGD", "MY": "MYR",
    "TH": "THB", "VN": "VND", "ID": "IDR", "PH": "PHP",
    "KR": "KRW", "HK": "HKD", "TW": "TWD", "AR": "ARS",
    "CL": "CLP", "CO": "COP", "PE": "PEN", "VE": "VES",
    "UY": "UYU", "PY": "PYG", "BO": "BOB", "EC": "USD",
    "CR": "CRC", "PA": "PAB", "GT": "GTQ", "HN": "HNL",
    "SV": "USD", "NI": "NIO", "DO": "DOP", "JM": "JMD",
    "TT": "TTD", "BB": "BBD", "BS": "BSD", "BZ": "BZD",
    "GY": "GYD", "SR": "SRD",
}

# Approximate country → default timezone (the capital's timezone).
COUNTRY_TIMEZONE_MAP: dict[str, str] = {
    "KE": "Africa/Nairobi",
    "US": "America/New_York",
    "GB": "Europe/London",
    "DE": "Europe/Berlin",
    "FR": "Europe/Paris",
    "IT": "Europe/Rome",
    "ES": "Europe/Madrid",
    "NL": "Europe/Amsterdam",
    "BE": "Europe/Brussels",
    "AT": "Europe/Vienna",
    "IE": "Europe/Dublin",
    "PT": "Europe/Lisbon",
    "FI": "Europe/Helsinki",
    "GR": "Europe/Athens",
    "CA": "America/Toronto",
    "AU": "Australia/Sydney",
    "NZ": "Pacific/Auckland",
    "JP": "Asia/Tokyo",
    "CN": "Asia/Shanghai",
    "IN": "Asia/Kolkata",
    "BR": "America/Sao_Paulo",
    "MX": "America/Mexico_City",
    "ZA": "Africa/Johannesburg",
    "NG": "Africa/Lagos",
    "GH": "Africa/Accra",
    "TZ": "Africa/Dar_es_Salaam",
    "UG": "Africa/Kampala",
    "RW": "Africa/Kigali",
    "ET": "Africa/Addis_Ababa",
    "EG": "Africa/Cairo",
    "MA": "Africa/Casablanca",
    "DZ": "Africa/Algiers",
    "TN": "Africa/Tunis",
    "SN": "Africa/Dakar",
    "CI": "Africa/Abidjan",
    "CM": "Africa/Douala",
    "ZM": "Africa/Lusaka",
    "ZW": "Africa/Harare",
    "MW": "Africa/Blantyre",
    "MZ": "Africa/Maputo",
    "AO": "Africa/Luanda",
    "NA": "Africa/Windhoek",
    "BW": "Africa/Gaborone",
    "MU": "Indian/Mauritius",
    "SC": "Indian/Mahe",
    "CH": "Europe/Zurich",
    "NO": "Europe/Oslo",
    "SE": "Europe/Stockholm",
    "DK": "Europe/Copenhagen",
    "PL": "Europe/Warsaw",
    "CZ": "Europe/Prague",
    "HU": "Europe/Budapest",
    "RO": "Europe/Bucharest",
    "RU": "Europe/Moscow",
    "UA": "Europe/Kyiv",
    "TR": "Europe/Istanbul",
    "IL": "Asia/Jerusalem",
    "SA": "Asia/Riyadh",
    "AE": "Asia/Dubai",
    "QA": "Asia/Qatar",
    "KW": "Asia/Kuwait",
    "JO": "Asia/Amman",
    "LB": "Asia/Beirut",
    "PK": "Asia/Karachi",
    "BD": "Asia/Dhaka",
    "LK": "Asia/Colombo",
    "NP": "Asia/Kathmandu",
    "SG": "Asia/Singapore",
    "MY": "Asia/Kuala_Lumpur",
    "TH": "Asia/Bangkok",
    "VN": "Asia/Ho_Chi_Minh",
    "ID": "Asia/Jakarta",
    "PH": "Asia/Manila",
    "KR": "Asia/Seoul",
    "HK": "Asia/Hong_Kong",
    "TW": "Asia/Taipei",
    "AR": "America/Argentina/Buenos_Aires",
    "CL": "America/Santiago",
    "CO": "America/Bogota",
    "PE": "America/Lima",
    "VE": "America/Caracas",
    "UY": "America/Montevideo",
    "PY": "America/Asuncion",
    "BO": "America/La_Paz",
    "EC": "America/Guayaquil",
    "CR": "America/Costa_Rica",
    "PA": "America/Panama",
    "GT": "America/Guatemala",
    "HN": "America/Tegucigalpa",
    "SV": "America/El_Salvador",
    "NI": "America/Managua",
    "DO": "America/Santo_Domingo",
    "JM": "America/Jamaica",
    "TT": "America/Port_of_Spain",
}


@lru_cache(maxsize=1)
def list_countries() -> list[dict]:
    """Return all ISO countries with suggested currency + timezone."""
    countries = []
    for c in pycountry.countries:
        code = c.alpha_2
        currency = COUNTRY_CURRENCY_MAP.get(code)
        tz = COUNTRY_TIMEZONE_MAP.get(code)
        countries.append(
            {
                "code": code,
                "name": c.name,
                "currency": currency,
                "timezone": tz,
            }
        )
    return sorted(countries, key=lambda x: x["name"])


@lru_cache(maxsize=1)
def list_currencies() -> list[dict]:
    """Return all ISO 4217 currencies with symbols and names."""
    codes = sorted(set(COUNTRY_CURRENCY_MAP.values()))
    result = []
    for code in codes:
        try:
            name = get_currency_name(code, locale="en")
        except Exception:
            name = code
        try:
            symbol = get_currency_symbol(code, locale="en")
        except Exception:
            symbol = code
        result.append({"code": code, "name": name, "symbol": symbol})
    return result


@lru_cache(maxsize=1)
def list_timezones() -> list[dict]:
    """Return all IANA timezones grouped by region."""
    from zoneinfo import available_timezones

    tzs = sorted(available_timezones())
    grouped: dict[str, list[str]] = {}
    for tz in tzs:
        if tz in ("UTC", "GMT") or "/" not in tz:
            continue
        region = tz.split("/")[0]
        grouped.setdefault(region, []).append(tz)

    return [
        {"region": region, "zones": zones}
        for region, zones in sorted(grouped.items())
    ]


def is_valid_currency(code: str) -> bool:
    return code.upper() in {c["code"] for c in list_currencies()}


def is_valid_timezone(tz: str) -> bool:
    from zoneinfo import available_timezones

    return tz in available_timezones() or tz == "UTC"


def is_valid_country(code: str) -> bool:
    return pycountry.countries.get(alpha_2=code.upper()) is not None


def format_money(amount: float, currency: str, locale: str = "en") -> str:
    """Format an amount using Babel. Used by the API when returning totals."""
    from babel.numbers import format_currency

    return format_currency(amount, currency, locale=locale)
