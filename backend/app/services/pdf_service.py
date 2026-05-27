"""PDF generation for КП using fpdf2.

Downloads DejaVu font on first use to support Cyrillic text.
"""
import os
import urllib.request
from datetime import datetime
from fpdf import FPDF

FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "fonts")
FONT_PATH = os.path.join(FONT_DIR, "DejaVuSans.ttf")
FONT_URL = "https://github.com/reingart/pyfpdf/raw/master/font/DejaVuSans.ttf"
PDF_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "pdfs")

VAT_RATE = 0.12


def _ensure_font():
    os.makedirs(FONT_DIR, exist_ok=True)
    if not os.path.exists(FONT_PATH):
        print(f"[PDF] Downloading DejaVu font to {FONT_PATH} ...")
        urllib.request.urlretrieve(FONT_URL, FONT_PATH)
        print("[PDF] Font downloaded.")


def _fmt_money(amount: float) -> str:
    return f"{amount:,.2f} ₸".replace(",", " ")


def generate_pdf(proposal) -> str:
    _ensure_font()
    os.makedirs(PDF_DIR, exist_ok=True)

    pdf = FPDF()
    pdf.add_page()
    pdf.add_font("DejaVu", "", FONT_PATH, uni=True)
    pdf.add_font("DejaVu", "B", FONT_PATH, uni=True)

    # Header
    pdf.set_font("DejaVu", "B", 16)
    pdf.set_fill_color(30, 64, 175)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 14, "  ЦОД — Коммерческое предложение", fill=True, ln=True)
    pdf.ln(4)

    pdf.set_text_color(0, 0, 0)
    pdf.set_font("DejaVu", "B", 11)
    pdf.cell(0, 8, f"№ {proposal.number}", ln=True)

    pdf.set_font("DejaVu", "", 10)
    pdf.cell(0, 6, f"Дата составления: {proposal.created_at.strftime('%d.%m.%Y')}", ln=True)
    pdf.cell(0, 6, f"Срок действия: {proposal.validity_days} дней", ln=True)
    pdf.ln(4)

    # Client & Manager block
    pdf.set_font("DejaVu", "B", 11)
    pdf.cell(0, 8, "Клиент", ln=True)
    pdf.set_font("DejaVu", "", 10)
    pdf.cell(0, 6, f"Компания: {proposal.client_company}", ln=True)
    pdf.cell(0, 6, f"Контактное лицо: {proposal.client_contact}", ln=True)
    pdf.cell(0, 6, f"Email: {proposal.client_email}", ln=True)
    if proposal.client_phone:
        pdf.cell(0, 6, f"Телефон: {proposal.client_phone}", ln=True)
    pdf.ln(2)

    pdf.set_font("DejaVu", "B", 11)
    pdf.cell(0, 8, "Менеджер", ln=True)
    pdf.set_font("DejaVu", "", 10)
    pdf.cell(0, 6, f"{proposal.manager.name} ({proposal.manager.email})", ln=True)
    pdf.ln(4)

    # Items table
    pdf.set_font("DejaVu", "B", 10)
    pdf.set_fill_color(220, 234, 255)
    col_w = [10, 75, 20, 28, 28, 29]
    headers = ["№", "Наименование", "Ед.", "Цена (₸)", "Кол.", "Сумма (₸)"]
    for i, h in enumerate(headers):
        pdf.cell(col_w[i], 8, h, border=1, fill=True)
    pdf.ln()

    pdf.set_font("DejaVu", "", 9)
    current_category = None
    row_num = 0
    for item in proposal.items:
        if item.category_name and item.category_name != current_category:
            current_category = item.category_name
            pdf.set_font("DejaVu", "B", 9)
            pdf.set_fill_color(240, 245, 255)
            pdf.cell(sum(col_w), 7, f"  {current_category}", border=1, fill=True, ln=True)
            pdf.set_font("DejaVu", "", 9)

        row_num += 1
        fill = row_num % 2 == 0
        pdf.set_fill_color(252, 252, 252) if fill else pdf.set_fill_color(255, 255, 255)
        pdf.cell(col_w[0], 7, str(row_num), border=1, fill=fill)
        pdf.cell(col_w[1], 7, item.product_name[:45], border=1, fill=fill)
        pdf.cell(col_w[2], 7, item.unit, border=1, fill=fill, align="C")
        pdf.cell(col_w[3], 7, _fmt_money(item.price), border=1, fill=fill, align="R")
        pdf.cell(col_w[4], 7, str(item.quantity), border=1, fill=fill, align="C")
        pdf.cell(col_w[5], 7, _fmt_money(item.total), border=1, fill=fill, align="R")
        pdf.ln()

    # Totals
    pdf.ln(3)
    pdf.set_font("DejaVu", "", 10)
    right_x = 210 - 20 - 60
    pdf.set_x(right_x)
    pdf.cell(40, 7, "Итого без НДС:", align="R")
    pdf.cell(20, 7, _fmt_money(proposal.subtotal), align="R", ln=True)

    pdf.set_x(right_x)
    pdf.cell(40, 7, "НДС 12%:", align="R")
    pdf.cell(20, 7, _fmt_money(proposal.vat_amount), align="R", ln=True)

    pdf.set_font("DejaVu", "B", 11)
    pdf.set_x(right_x)
    pdf.cell(40, 9, "ИТОГО С НДС:", align="R")
    pdf.cell(20, 9, _fmt_money(proposal.total), align="R", ln=True)

    # Comment
    if proposal.comment:
        pdf.ln(4)
        pdf.set_font("DejaVu", "B", 10)
        pdf.cell(0, 7, "Дополнительные условия:", ln=True)
        pdf.set_font("DejaVu", "", 9)
        pdf.multi_cell(0, 6, proposal.comment)

    # Signatures
    pdf.ln(10)
    pdf.set_font("DejaVu", "B", 10)
    pdf.cell(90, 7, "Менеджер")
    pdf.cell(90, 7, "Руководитель отдела продаж", ln=True)
    pdf.set_font("DejaVu", "", 9)
    if proposal.manager_signed_at:
        pdf.cell(90, 7, f"Подписано ЭЦП: {proposal.manager_signed_at.strftime('%d.%m.%Y %H:%M')}")
    else:
        pdf.cell(90, 7, "Подпись: ___________________")
    if proposal.head_signed_at:
        pdf.cell(90, 7, f"Подписано ЭЦП: {proposal.head_signed_at.strftime('%d.%m.%Y %H:%M')}", ln=True)
    else:
        pdf.cell(90, 7, "Подпись: ___________________", ln=True)

    # Footer
    pdf.ln(6)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 5, "Документ сформирован автоматически системой управления прайс-листом ЦОД", align="C", ln=True)

    filename = os.path.join(PDF_DIR, f"{proposal.number}.pdf")
    pdf.output(filename)
    return filename
