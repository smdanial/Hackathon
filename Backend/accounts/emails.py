"""Transactional email sending via Resend (https://resend.com).

Configuration comes from environment variables (see ``campusease/settings``):

- ``RESEND_API_KEY`` — the Resend API key (send requests without it fail
  gracefully, letting the DEBUG code fallback take over).
- ``RESEND_FROM_EMAIL`` — a verified sender, e.g. "CampusEase
  <noreply@yourdomain.com>". Defaults to Resend's test sender.
- ``FRONTEND_URL`` — the app base URL used in emailed links.
"""

import logging
from urllib.parse import quote

from django.conf import settings

logger = logging.getLogger(__name__)


def build_reset_url(uidb64: str, token: str) -> str:
    """The /reset-password link for one reset token (URL-encoded)."""
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    uid = quote(uidb64, safe="")
    tok = quote(token, safe="")
    return f"{frontend_url}/reset-password?uidb64={uid}&token={tok}"


def send_password_reset_email(student, uidb64: str, token: str) -> bool:
    """Email the student a password-reset link via Resend.

    Returns True when an email was actually handed to Resend. Returns False
    when no API key is configured or the send fails — the caller can then
    fall back to returning the code in DEBUG (no email server available).
    """
    api_key = getattr(settings, "RESEND_API_KEY", "")
    if not api_key:
        logger.info("RESEND_API_KEY not set — skipping password reset email.")
        return False

    try:
        import resend
    except ImportError:
        logger.exception("The 'resend' package is not installed.")
        return False

    from_address = getattr(
        settings, "RESEND_FROM_EMAIL", "CampusEase <onboarding@resend.dev>"
    )
    reset_url = build_reset_url(uidb64, token)

    params = {
        "from": from_address,
        "to": [student.email],
        "subject": "Reset your CampusEase password",
        "html": (
            "<div style=\"font-family:Arial,Helvetica,sans-serif;max-width:480px;"
            "margin:0 auto;padding:24px\">"
            "<h2 style=\"color:#6E2F85\">Reset your CampusEase password</h2>"
            f"<p>Hi {student.full_name or student.email},</p>"
            "<p>We got a request to reset your password. Click the button "
            "below to choose a new one:</p>"
            f"<p><a href=\"{reset_url}\" style=\"display:inline-block;"
            "background:#8A3FA0;color:#ffffff;text-decoration:none;"
            "padding:12px 22px;border-radius:10px;font-weight:bold\">"
            "Reset my password</a></p>"
            f"<p style=\"font-size:13px;color:#666\">Or open this link: "
            f"<a href=\"{reset_url}\">{reset_url}</a></p>"
            "<p style=\"font-size:13px;color:#666\">If you didn't ask for "
            "this, you can safely ignore this email — your password won't "
            "change.</p>"
            "</div>"
        ),
    }

    try:
        resend.api_key = api_key
        resend.Emails.send(params)
        logger.info("Password reset email queued for %s", student.email)
        return True
    except Exception:
        logger.exception("Failed to send password reset email to %s", student.email)
        return False
