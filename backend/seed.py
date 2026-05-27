"""Seed the database with initial data: users, categories, products."""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models import User, ProductCategory, Product, UserRole
from app.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── Users ─────────────────────────────────────────────────────────────────────
if not db.query(User).first():
    users = [
        User(name="Алия Бекова",     email="manager@cod.kz",  password_hash=hash_password("manager123"),  role=UserRole.manager),
        User(name="Сания Нурова",    email="manager2@cod.kz", password_hash=hash_password("manager123"),  role=UserRole.manager),
        User(name="Бауыржан Сейтов", email="head@cod.kz",     password_hash=hash_password("head123"),     role=UserRole.head),
        User(name="Администратор",   email="admin@cod.kz",    password_hash=hash_password("admin123"),    role=UserRole.admin),
    ]
    db.add_all(users)
    db.commit()
    print("✓ Users created")

# ── Categories & Products ──────────────────────────────────────────────────────
if not db.query(ProductCategory).first():
    catalog = [
        {
            "name": "Колокация", "sort_order": 1,
            "products": [
                {"name": "Аренда стойки (42U)",         "description": "Полная стойка 42U, 220В/16А",               "price": 180_000, "unit": "стойка/мес"},
                {"name": "Аренда половины стойки (21U)", "description": "Половина стойки 21U",                       "price": 100_000, "unit": "стойка/мес"},
                {"name": "Аренда 1U места",             "description": "1 юнит в стойке",                           "price":  10_000, "unit": "1U/мес"},
                {"name": "Электропитание (220В/16А)",   "description": "Дополнительная линия электропитания",        "price":  15_000, "unit": "линия/мес"},
                {"name": "Электропитание (220В/32А)",   "description": "Мощная линия 32А",                           "price":  25_000, "unit": "линия/мес"},
                {"name": "КВт потребляемой мощности",   "description": "Оплата за кВт·ч сверх базового тарифа",     "price":   4_500, "unit": "кВт/мес"},
                {"name": "Удалённые руки (1 час)",      "description": "Выезд инженера / физические работы в ЦОД",  "price":  12_000, "unit": "час"},
            ],
        },
        {
            "name": "Облачные услуги (IaaS)", "sort_order": 2,
            "products": [
                {"name": "vCPU",                        "description": "1 виртуальный процессорный поток",           "price":   3_000, "unit": "vCPU/мес"},
                {"name": "RAM",                         "description": "1 ГБ оперативной памяти",                   "price":   1_200, "unit": "ГБ/мес"},
                {"name": "SSD-диск (NVMe)",             "description": "Высокопроизводительный SSD-том",             "price":     800, "unit": "ГБ/мес"},
                {"name": "HDD-диск",                    "description": "Стандартный HDD-том",                        "price":     200, "unit": "ГБ/мес"},
                {"name": "Публичный IP-адрес",          "description": "Выделенный IPv4-адрес",                      "price":   2_500, "unit": "IP/мес"},
                {"name": "Windows Server лицензия",     "description": "Windows Server 2022 SPLA",                  "price":  18_000, "unit": "vCPU/мес"},
                {"name": "Снапшот (snapshot)",          "description": "Точка восстановления виртуальной машины",    "price":     300, "unit": "ГБ/мес"},
            ],
        },
        {
            "name": "Сетевые услуги", "sort_order": 3,
            "products": [
                {"name": "Интернет-канал (100 Мбит/с)", "description": "Гарантированная полоса 100 Мбит/с",         "price":  50_000, "unit": "мес"},
                {"name": "Интернет-канал (1 Гбит/с)",   "description": "Гарантированная полоса 1 Гбит/с",           "price": 200_000, "unit": "мес"},
                {"name": "Кросс-коннект (1G)",          "description": "Прямое соединение между клиентами внутри ЦОД","price":  15_000, "unit": "порт/мес"},
                {"name": "CDN-трафик",                  "description": "Доставка контента через CDN-сеть",          "price":       5, "unit": "ГБ"},
                {"name": "DDoS-защита (базовая)",       "description": "Защита до 10 Гбит/с",                       "price":  30_000, "unit": "мес"},
                {"name": "DDoS-защита (расширенная)",   "description": "Защита до 100 Гбит/с + WAF",                "price": 120_000, "unit": "мес"},
            ],
        },
        {
            "name": "Резервное копирование", "sort_order": 4,
            "products": [
                {"name": "Объём резервных копий",       "description": "Хранение резервных копий",                  "price":     150, "unit": "ГБ/мес"},
                {"name": "Veeam Backup лицензия",       "description": "Лицензия Veeam Backup & Replication",       "price":  25_000, "unit": "VM/год"},
                {"name": "Geo-репликация данных",       "description": "Репликация в резервный ЦОД",                "price":   5_000, "unit": "ГБ/мес"},
                {"name": "Аварийное восстановление",    "description": "DRaaS — полный план восстановления",        "price": 150_000, "unit": "мес"},
            ],
        },
        {
            "name": "Информационная безопасность", "sort_order": 5,
            "products": [
                {"name": "Антивирус (Kaspersky)",       "description": "Корпоративная лицензия Kaspersky Endpoint", "price":  12_000, "unit": "устройство/год"},
                {"name": "WAF (Web Application Firewall)","description": "Защита веб-приложений",                  "price":  80_000, "unit": "мес"},
                {"name": "Сертификат SSL/TLS",          "description": "Wildcard SSL-сертификат",                  "price":  35_000, "unit": "год"},
                {"name": "Аудит безопасности",          "description": "Пентест и отчёт об уязвимостях",          "price": 500_000, "unit": "проект"},
                {"name": "SIEM — подключение источника","description": "Подключение одного источника логов в SIEM","price":  20_000, "unit": "источник/мес"},
            ],
        },
        {
            "name": "Техническая поддержка", "sort_order": 6,
            "products": [
                {"name": "Поддержка 8×5 (базовая)",    "description": "Email + телефон, SLA 8 часов",              "price":  30_000, "unit": "мес"},
                {"name": "Поддержка 24×7 (стандарт)",  "description": "Email + телефон + чат, SLA 4 часа",         "price":  80_000, "unit": "мес"},
                {"name": "Поддержка 24×7 (премиум)",   "description": "Выделенный инженер, SLA 1 час",             "price": 200_000, "unit": "мес"},
                {"name": "Консультация (1 час)",        "description": "Разовая техническая консультация",          "price":  15_000, "unit": "час"},
                {"name": "Миграция данных",             "description": "Проект переноса данных в ЦОД",             "price": 300_000, "unit": "проект"},
            ],
        },
    ]

    for cat_data in catalog:
        products_data = cat_data.pop("products")
        cat = ProductCategory(**cat_data)
        db.add(cat)
        db.flush()
        for p in products_data:
            db.add(Product(category_id=cat.id, currency="KZT", **p))

    db.commit()
    print("✓ Catalog seeded")

db.close()
print("\nДанные для входа:")
print("  Менеджер:     manager@cod.kz  / manager123")
print("  Менеджер 2:   manager2@cod.kz / manager123")
print("  Руководитель: head@cod.kz     / head123")
print("  Администратор: admin@cod.kz   / admin123")
