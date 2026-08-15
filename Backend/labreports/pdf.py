"""Render a NITER lab report cover page as a PDF.

The output mirrors the reference "Lab Report Cover.docx" design exactly:

* A4 page with a thick (6pt) black border frame around the whole sheet
* Institute name ("National Institute of Textile Engineering and Research."),
  then the NITER logo band beneath it, then the centered department line
* Course Title / Course Code / Date of Submission / Name of Experiment as
  bold-label rows
* A bordered "Remarks:" box
* The 3-column bordered table: Submitted By | Submitted To |
  Signature of Course Teacher (in the third box)

Only the variable fields differ per report (department, course details, the
student's Submitted By block and the teacher's Submitted To block).
"""

import os
from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

PAGE_W, PAGE_H = A4  # 210mm x 297mm

# Margins from the reference docx (pgMar, twips -> mm).
MARGIN_LEFT = 17.5 * mm
MARGIN_RIGHT = 15.0 * mm
MARGIN_TOP = 24.0 * mm

# The page border is 6pt (48 eighths of a point) black, offset ~1mm from the
# page edge so it survives printing.
FRAME_INSET = 1.0 * mm
FRAME_WIDTH = 6

LOGO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "niter-logo.png")

DEPT_NAMES = {
    "CSE": "Computer Science & Engineering",
    "EEE": "Electrical & Electronic Engineering",
    "TE": "Textile Engineering",
    "IPE": "Industrial & Production Engineering",
    "FDAE": "Fashion Design & Apparel Engineering",
}


def _date_display(value):
    """2026-08-14 -> 14-AUG-2026 (the format used on the reference cover)."""
    if not value:
        return "—"
    try:
        parsed = datetime.strptime(str(value)[:10], "%Y-%m-%d")
        return parsed.strftime("%d-%b-%Y").upper()
    except ValueError:
        return "—"


def build_cover_pdf(data: dict) -> bytes:
    """Return the rendered cover page as PDF bytes.

    ``data`` carries the same fields as a saved LabReport (snake_case), with
    ``student_name`` / ``student_id`` already resolved.
    """
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setTitle("Lab Report Cover")
    c.setAuthor("CampusEase")
    c.setSubject("NITER Lab Report Cover Page")

    black = colors.black

    # ---- 6pt black page frame ----
    c.setLineWidth(FRAME_WIDTH)
    c.setStrokeColor(black)
    c.rect(
        FRAME_INSET,
        FRAME_INSET,
        PAGE_W - 2 * FRAME_INSET,
        PAGE_H - 2 * FRAME_INSET,
    )

    x_left = MARGIN_LEFT
    x_right = PAGE_W - MARGIN_RIGHT
    # Top-down cursor, starting below the top margin.
    y = PAGE_H - MARGIN_TOP

    # ---- 1) Institute name (Heading1: bold 18pt, left indent ~13.4mm) ----
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(black)
    c.drawString(x_left + 13.4 * mm, y, "National Institute of Textile Engineering and Research.")
    y -= 6 * mm

    # ---- 2) NITER logo band, centered ----
    logo_w = 58 * mm
    logo_h = logo_w * (232 / 220)  # keep the image's 220x232 ratio
    if os.path.exists(LOGO_PATH):
        try:
            c.drawImage(
                LOGO_PATH,
                (PAGE_W - logo_w) / 2,
                y - logo_h,
                logo_w,
                logo_h,
                preserveAspectRatio=True,
                mask="auto",
            )
        except Exception:
            # Never break the whole PDF for a logo hiccup.
            pass
    y -= logo_h + 9 * mm

    # ---- 3) Department line (Heading2: bold 14pt, centered) ----
    dept = data.get("department", "")
    dept_name = DEPT_NAMES.get(dept, dept) or "—"
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(PAGE_W / 2, y, f"Department of {dept_name}.")
    y -= 15 * mm

    # ---- 4) Course info (bold label + value, 12pt, left indent ~3.4mm) ----
    def course_line(label, value):
        nonlocal y
        text = value or "…"
        c.setFont("Helvetica-Bold", 12)
        label_text = f"{label}:"
        label_width = c.stringWidth(label_text, "Helvetica-Bold", 12)
        c.drawString(x_left + 3.4 * mm, y, label_text)
        c.setFont("Helvetica", 12)
        c.drawString(x_left + 3.4 * mm + label_width + 2, y, text)
        y -= 7 * mm

    course_line("Course Title", data.get("course_title"))
    course_line("Course Code", data.get("course_code"))
    course_line("Date of Submission", _date_display(data.get("date_of_submission")))
    course_line("Name of Experiment", data.get("experiment_name"))
    y -= 2 * mm

    # ---- 5) Remarks box (bordered rectangle with a bold label) ----
    box_x = x_left + 3.4 * mm
    box_w = x_right - box_x
    box_h = 30 * mm
    c.setLineWidth(0.5)
    c.setStrokeColor(black)
    c.rect(box_x, y - box_h, box_w, box_h)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(box_x + 2 * mm, y - 5.5 * mm, "Remarks:")
    if data.get("remarks"):
        c.setFont("Helvetica", 12)
        c.drawString(box_x + 2 * mm, y - 11.5 * mm, str(data["remarks"]))
    y -= box_h + 8 * mm

    # ---- 6) Submitted By / Submitted To — the bordered 3-column table ----
    table_x = x_left
    col_w = (x_right - x_left) / 3
    header_h = 12 * mm
    body_h = 46 * mm
    table_top = y
    c.setLineWidth(0.5)
    # Outer border + the two inner vertical dividers + the header divider.
    c.rect(table_x, table_top - header_h - body_h, x_right - table_x, header_h + body_h)
    c.line(table_x + col_w, table_top, table_x + col_w, table_top - header_h - body_h)
    c.line(table_x + 2 * col_w, table_top, table_x + 2 * col_w, table_top - header_h - body_h)
    c.line(table_x, table_top - header_h, x_right, table_top - header_h)

    # Header cells — bold 14pt, centered.
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(table_x + col_w / 2, table_top - header_h / 2 - 4.5, "Submitted By")
    c.drawCentredString(table_x + 3 * col_w / 2, table_top - header_h / 2 - 4.5, "Submitted To")

    # Body cells — 12pt.
    body_y = table_top - header_h
    cell_pad = 3.5 * mm

    def cell_line(x, text_parts, line_y, gap=6.5 * mm):
        """Draw a left-aligned line made of (font, text) parts into the table."""
        cursor = x
        for font_name, part in text_parts:
            c.setFont(font_name, 12)
            c.drawString(cursor, line_y, part)
            cursor += c.stringWidth(part, font_name, 12)
        return line_y - gap

    line_y = body_y - cell_pad - 2 * mm

    # Submitted By — Name / Student ID / Section / Level-Term / Session.
    line_y = cell_line(
        table_x + cell_pad,
        [("Helvetica-Bold", "Name:"), ("Helvetica", f" {data.get('student_name', '') or '—'}")],
        line_y,
    )
    line_y = cell_line(
        table_x + cell_pad,
        [("Helvetica-Bold", "Student ID:"), ("Helvetica", f" {data.get('student_id', '') or '—'}")],
        line_y,
    )
    line_y = cell_line(
        table_x + cell_pad,
        [("Helvetica-Bold", "Section:"), ("Helvetica", f" {data.get('section', '') or '—'}")],
        line_y,
    )
    line_y = cell_line(
        table_x + cell_pad,
        [("Helvetica-Bold", "Level-Term:"), ("Helvetica", f" {data.get('level_term', '') or '—'}")],
        line_y,
    )
    cell_line(
        table_x + cell_pad,
        [("Helvetica-Bold", "Session:"), ("Helvetica", f" {data.get('session', '') or '—'}")],
        line_y,
    )

    # Submitted To — teacher name (bold), rank (italic), department (bold)
    # in the SECOND column (the first inner divider). Every line is wrapped at
    # word boundaries so it always fits inside the column — no overflow for
    # any department name.
    middle_x = table_x + col_w
    text_col_width = col_w - 2 * cell_pad

    def wrap_to_width(text, font_name, font_size):
        """Break ``text`` so each line fits within the column width."""
        words = text.split()
        lines, current = [], ""
        for word in words:
            candidate = f"{current} {word}" if current else word
            if not current or c.stringWidth(candidate, font_name, font_size) <= text_col_width:
                current = candidate
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
        return lines or [text]

    line_y = body_y - cell_pad - 2 * mm
    for line in wrap_to_width(data.get("teacher_name", "") or "—", "Helvetica-Bold", 12):
        line_y = cell_line(middle_x + cell_pad, [("Helvetica-Bold", line)], line_y)
    if data.get("teacher_rank"):
        for line in wrap_to_width(f"({data['teacher_rank']})", "Helvetica-Oblique", 12):
            line_y = cell_line(middle_x + cell_pad, [("Helvetica-Oblique", line)], line_y)
    teacher_dept = data.get("teacher_department", "")
    teacher_dept_name = DEPT_NAMES.get(teacher_dept, teacher_dept)
    if teacher_dept_name:
        for line in wrap_to_width(
            f"{teacher_dept_name} ({teacher_dept})", "Helvetica-Bold", 12
        ):
            line_y = cell_line(middle_x + cell_pad, [("Helvetica-Bold", line)], line_y - 2 * mm)

    # Third box — "Signature of Course Teacher" (bold-italic, centered,
    # 10pt in the reference docx), anchored to the BOTTOM of the box.
    right_x = table_x + 3 * col_w
    sig_center = (right_x + table_x + 2 * col_w) / 2
    c.setFont("Helvetica-BoldOblique", 10)
    sig_y = body_y - body_h + cell_pad + 3 * mm
    c.drawCentredString(sig_center, sig_y, "Signature of Course Teacher")

    y = table_top - header_h - body_h - 10 * mm

    c.showPage()
    c.save()
    return buffer.getvalue()
