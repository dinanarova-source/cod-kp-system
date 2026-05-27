"""Email service — logs to console for MVP.
Replace print() calls with real SMTP/SendGrid integration in production.
"""
from datetime import datetime


def notify_head(proposal) -> None:
    print(
        f"[EMAIL] → Руководителю: новое КП {proposal.number} от {proposal.manager.name} "
        f"на сумму {proposal.total:,.0f} ₸, клиент: {proposal.client_company}"
    )


def notify_manager_approved(proposal) -> None:
    print(
        f"[EMAIL] → {proposal.manager.email}: КП {proposal.number} подписано руководителем. "
        f"Можно отправлять клиенту."
    )


def notify_manager_rejected(proposal) -> None:
    print(
        f"[EMAIL] → {proposal.manager.email}: КП {proposal.number} отклонено. "
        f"Причина: {proposal.head_comment}"
    )


def send_to_client(proposal) -> None:
    print(
        f"[EMAIL] → {proposal.client_email}: отправлено КП {proposal.number} "
        f"на сумму {proposal.total:,.0f} ₸ (PDF вложен)."
    )
