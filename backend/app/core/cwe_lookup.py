"""Static CWE-ID -> friendly name lookup covering common/MITRE Top 25 weaknesses.

NVD returns only the CWE ID (e.g. "CWE-79"), never a human-readable name.
Unmapped IDs fall back to the raw ID string.
"""

CWE_NAMES: dict[str, str] = {
    "CWE-79": "Cross-Site Scripting (XSS)",
    "CWE-89": "SQL Injection",
    "CWE-78": "OS Command Injection",
    "CWE-77": "Command Injection",
    "CWE-94": "Code Injection",
    "CWE-22": "Path Traversal",
    "CWE-352": "Cross-Site Request Forgery (CSRF)",
    "CWE-798": "Hardcoded Credentials",
    "CWE-611": "XML External Entity (XXE)",
    "CWE-918": "Server-Side Request Forgery (SSRF)",
    "CWE-502": "Deserialization of Untrusted Data",
    "CWE-434": "Unrestricted File Upload",
    "CWE-287": "Improper Authentication",
    "CWE-284": "Improper Access Control",
    "CWE-269": "Improper Privilege Management",
    "CWE-306": "Missing Authentication for Critical Function",
    "CWE-862": "Missing Authorization",
    "CWE-863": "Incorrect Authorization",
    "CWE-476": "NULL Pointer Dereference",
    "CWE-416": "Use After Free",
    "CWE-787": "Out-of-Bounds Write",
    "CWE-125": "Out-of-Bounds Read",
    "CWE-190": "Integer Overflow or Wraparound",
    "CWE-120": "Buffer Copy without Checking Size (Buffer Overflow)",
    "CWE-119": "Improper Restriction of Operations in Memory Buffer",
    "CWE-200": "Exposure of Sensitive Information",
    "CWE-522": "Insufficiently Protected Credentials",
    "CWE-319": "Cleartext Transmission of Sensitive Information",
    "CWE-327": "Use of a Broken or Risky Cryptographic Algorithm",
    "CWE-330": "Use of Insufficiently Random Values",
    "CWE-347": "Improper Verification of Cryptographic Signature",
    "CWE-732": "Incorrect Permission Assignment",
    "CWE-863ACL": "Incorrect Default Permissions",
    "CWE-59": "Link Following",
    "CWE-20": "Improper Input Validation",
    "CWE-400": "Uncontrolled Resource Consumption",
    "CWE-674": "Uncontrolled Recursion",
    "CWE-401": "Missing Release of Memory",
    "CWE-772": "Missing Release of Resource",
    "CWE-664": "Improper Control of a Resource Through its Lifetime",
    "CWE-668": "Exposure of Resource to Wrong Sphere",
    "CWE-269-2": "Privilege Escalation",
    "CWE-corsmisconfig": "CORS Misconfiguration",
    "CWE-601": "Open Redirect",
    "CWE-93": "CRLF Injection",
    "CWE-95": "Eval Injection",
    "CWE-434-2": "Unrestricted Upload of File with Dangerous Type",
    "CWE-843": "Type Confusion",
    "CWE-369": "Divide By Zero",
    "CWE-835": "Infinite Loop",
    "CWE-770": "Allocation of Resources Without Limits",
}

# NVD placeholder values that carry no real weakness-type information;
# excluded from the CWE-distribution metric so they don't dominate the chart.
CWE_PLACEHOLDERS = {"NVD-CWE-noinfo", "NVD-CWE-Other"}


def cwe_friendly_name(cwe_id: str) -> str:
    return CWE_NAMES.get(cwe_id, cwe_id)
