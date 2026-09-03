"""Shared helpers for CSV exports."""

FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def csv_escape(value: object) -> str:
    """Neutralize spreadsheet formula injection.

    Cells starting with =, +, -, @ (or tab/CR) are treated as formulas by
    Excel/LibreOffice/Sheets; a leading apostrophe forces text mode. Only
    apply to free-text fields — numeric/date columns are rendered from
    trusted types by the caller.
    """
    text = "" if value is None else str(value)
    if text.startswith(FORMULA_PREFIXES):
        return f"'{text}"
    return text
