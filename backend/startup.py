from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from database import SessionLocal
from models.user import User
from models.transfer import Transfer
from models.t2220_form import T2220Form
from models.zendesk_ticket import ZendeskTicket
from models.jira_ticket import JiraTicket
from auth import get_password_hash


def run_startup():
    db = SessionLocal()
    try:
        # Only seed if database is empty
        if db.query(User).first() is None:
            seed_users(db)
            seed_transfers_and_forms(db)
            seed_zendesk_tickets(db)
            print("Database seeded successfully!")
        else:
            print("Database already contains data, skipping seed.")
    finally:
        db.close()


def seed_users(db: Session):
    """Seed CS agents and admin users"""
    users = [
        User(
            username="sarah.mitchell",
            email="sarah.mitchell@wealthsimple.com",
            full_name="Sarah Mitchell",
            hashed_password=get_password_hash("password123"),
            is_admin=False,
            role="cs_agent"
        ),
        User(
            username="david.chen",
            email="david.chen@wealthsimple.com",
            full_name="David Chen",
            hashed_password=get_password_hash("password123"),
            is_admin=False,
            role="cs_agent"
        ),
        User(
            username="maria.garcia",
            email="maria.garcia@wealthsimple.com",
            full_name="Maria Garcia",
            hashed_password=get_password_hash("password123"),
            is_admin=False,
            role="cs_agent"
        ),
        User(
            username="admin",
            email="admin@wealthsimple.com",
            full_name="System Admin",
            hashed_password=get_password_hash("admin123"),
            is_admin=True,
            role="admin"
        ),
        User(
            username="transfers.team",
            email="transfers@wealthsimple.com",
            full_name="Transfers Team",
            hashed_password=get_password_hash("password123"),
            is_admin=False,
            role="transfers_team"
        ),
    ]
    db.add_all(users)
    db.commit()
    print(f"Created {len(users)} users")


def seed_transfers_and_forms(db: Session):
    """Seed transfers with various scenarios for training"""

    # Scenario 1: Clean transfer - All data matches (needs escalation)
    transfer1 = Transfer(
        reference_number="TRF-2024-001001",
        customer_name="Michael Thompson",
        customer_email="michael.t@email.com",
        from_institution="TD Bank",
        to_institution="Wealthsimple",
        account_number="4567890123",
        account_type="RRSP",
        transfer_type="full",
        transfer_amount=Decimal("45000.00"),
        status="pending",
        initiated_date=datetime.now() - timedelta(days=12),
        expected_completion=datetime.now() - timedelta(days=2),
        notes="Transfer initiated by customer, awaiting completion"
    )
    db.add(transfer1)
    db.flush()

    t2220_1 = T2220Form(
        form_number="T2220-2024-001001",
        transfer_id=transfer1.id,
        account_holder_name="Michael Thompson",
        account_number_on_form="4567890123",  # MATCHES
        account_type_on_form="RRSP",  # MATCHES
        transfer_amount_on_form=Decimal("45000.00"),  # MATCHES
        transfer_type_on_form="full",  # MATCHES
        signature_date=datetime.now() - timedelta(days=14),
        form_pdf_url="/forms/T2220-2024-001001.pdf"
    )
    db.add(t2220_1)

    # Scenario 2: Account number mismatch
    transfer2 = Transfer(
        reference_number="TRF-2024-001002",
        customer_name="Jennifer Wilson",
        customer_email="jwilson@email.com",
        from_institution="RBC Royal Bank",
        to_institution="Wealthsimple",
        account_number="7891234567",
        account_type="TFSA",
        transfer_type="full",
        transfer_amount=Decimal("28500.00"),
        status="pending",
        initiated_date=datetime.now() - timedelta(days=8),
        expected_completion=datetime.now() + timedelta(days=2),
        notes=""
    )
    db.add(transfer2)
    db.flush()

    t2220_2 = T2220Form(
        form_number="T2220-2024-001002",
        transfer_id=transfer2.id,
        account_holder_name="Jennifer Wilson",
        account_number_on_form="7891234568",  # MISMATCH - different last digit
        account_type_on_form="TFSA",
        transfer_amount_on_form=Decimal("28500.00"),
        transfer_type_on_form="full",
        signature_date=datetime.now() - timedelta(days=10),
        form_pdf_url="/forms/T2220-2024-001002.pdf"
    )
    db.add(t2220_2)

    # Scenario 3: Wrong account type - TFSA submitted as RRSP
    transfer3 = Transfer(
        reference_number="TRF-2024-001003",
        customer_name="Robert Martinez",
        customer_email="r.martinez@email.com",
        from_institution="Scotiabank",
        to_institution="Wealthsimple",
        account_number="1234567890",
        account_type="TFSA",
        transfer_type="full",
        transfer_amount=Decimal("15000.00"),
        status="pending",
        initiated_date=datetime.now() - timedelta(days=6),
        expected_completion=datetime.now() + timedelta(days=4),
        notes=""
    )
    db.add(transfer3)
    db.flush()

    t2220_3 = T2220Form(
        form_number="T2220-2024-001003",
        transfer_id=transfer3.id,
        account_holder_name="Robert Martinez",
        account_number_on_form="1234567890",
        account_type_on_form="RRSP",  # MISMATCH - wrong account type
        transfer_amount_on_form=Decimal("15000.00"),
        transfer_type_on_form="full",
        signature_date=datetime.now() - timedelta(days=8),
        form_pdf_url="/forms/T2220-2024-001003.pdf"
    )
    db.add(t2220_3)

    # Scenario 4: Amount discrepancy - partial transfer amount wrong
    transfer4 = Transfer(
        reference_number="TRF-2024-001004",
        customer_name="Amanda Lee",
        customer_email="amanda.lee@email.com",
        from_institution="BMO",
        to_institution="Wealthsimple",
        account_number="9876543210",
        account_type="RRSP",
        transfer_type="partial",
        transfer_amount=Decimal("25000.00"),
        status="pending",
        initiated_date=datetime.now() - timedelta(days=10),
        expected_completion=datetime.now() - timedelta(days=3),
        notes=""
    )
    db.add(transfer4)
    db.flush()

    t2220_4 = T2220Form(
        form_number="T2220-2024-001004",
        transfer_id=transfer4.id,
        account_holder_name="Amanda Lee",
        account_number_on_form="9876543210",
        account_type_on_form="RRSP",
        transfer_amount_on_form=Decimal("35000.00"),  # MISMATCH - wrong amount
        transfer_type_on_form="partial",
        signature_date=datetime.now() - timedelta(days=12),
        form_pdf_url="/forms/T2220-2024-001004.pdf"
    )
    db.add(t2220_4)

    # Scenario 5: Transfer type mismatch - Full vs Partial
    transfer5 = Transfer(
        reference_number="TRF-2024-001005",
        customer_name="Christopher Brown",
        customer_email="c.brown@email.com",
        from_institution="CIBC",
        to_institution="Wealthsimple",
        account_number="5432167890",
        account_type="Non-Registered",
        transfer_type="full",
        transfer_amount=Decimal("75000.00"),
        status="pending",
        initiated_date=datetime.now() - timedelta(days=15),
        expected_completion=datetime.now() - timedelta(days=5),
        notes=""
    )
    db.add(transfer5)
    db.flush()

    t2220_5 = T2220Form(
        form_number="T2220-2024-001005",
        transfer_id=transfer5.id,
        account_holder_name="Christopher Brown",
        account_number_on_form="5432167890",
        account_type_on_form="Non-Registered",
        transfer_amount_on_form=Decimal("75000.00"),
        transfer_type_on_form="partial",  # MISMATCH - should be full
        signature_date=datetime.now() - timedelta(days=17),
        form_pdf_url="/forms/T2220-2024-001005.pdf"
    )
    db.add(t2220_5)

    # Scenario 6: Multiple issues - account type AND amount mismatch
    transfer6 = Transfer(
        reference_number="TRF-2024-001006",
        customer_name="Emily Davis",
        customer_email="emily.d@email.com",
        from_institution="National Bank",
        to_institution="Wealthsimple",
        account_number="6789012345",
        account_type="RESP",
        transfer_type="full",
        transfer_amount=Decimal("12000.00"),
        status="pending",
        initiated_date=datetime.now() - timedelta(days=5),
        expected_completion=datetime.now() + timedelta(days=5),
        notes=""
    )
    db.add(transfer6)
    db.flush()

    t2220_6 = T2220Form(
        form_number="T2220-2024-001006",
        transfer_id=transfer6.id,
        account_holder_name="Emily Davis",
        account_number_on_form="6789012345",
        account_type_on_form="TFSA",  # MISMATCH - should be RESP
        transfer_amount_on_form=Decimal("15000.00"),  # MISMATCH - different amount
        transfer_type_on_form="full",
        signature_date=datetime.now() - timedelta(days=7),
        form_pdf_url="/forms/T2220-2024-001006.pdf"
    )
    db.add(t2220_6)

    # Scenario 7: Clean transfer - older, ready for escalation
    transfer7 = Transfer(
        reference_number="TRF-2024-001007",
        customer_name="James Anderson",
        customer_email="j.anderson@email.com",
        from_institution="Desjardins",
        to_institution="Wealthsimple",
        account_number="3456789012",
        account_type="RRSP",
        transfer_type="full",
        transfer_amount=Decimal("92000.00"),
        status="pending",
        initiated_date=datetime.now() - timedelta(days=20),
        expected_completion=datetime.now() - timedelta(days=10),
        notes="Long-pending transfer, all documentation verified"
    )
    db.add(transfer7)
    db.flush()

    t2220_7 = T2220Form(
        form_number="T2220-2024-001007",
        transfer_id=transfer7.id,
        account_holder_name="James Anderson",
        account_number_on_form="3456789012",
        account_type_on_form="RRSP",
        transfer_amount_on_form=Decimal("92000.00"),
        transfer_type_on_form="full",
        signature_date=datetime.now() - timedelta(days=22),
        form_pdf_url="/forms/T2220-2024-001007.pdf"
    )
    db.add(t2220_7)

    db.commit()
    print("Created 7 transfers with T2220 forms (various scenarios)")


def seed_zendesk_tickets(db: Session):
    """Seed Zendesk tickets for the transfers"""

    # Get transfers
    transfers = db.query(Transfer).all()
    transfer_map = {t.reference_number: t for t in transfers}

    tickets = [
        # Ticket for clean transfer (Scenario 1)
        ZendeskTicket(
            ticket_number="ZEN-892341",
            customer_name="Michael Thompson",
            customer_email="michael.t@email.com",
            subject="RRSP Transfer from TD Bank - Still Pending",
            description="Hi, I initiated a transfer of my RRSP from TD Bank to Wealthsimple about 2 weeks ago. The expected completion date has passed but the funds haven't arrived yet. Can someone please check on the status? Reference: TRF-2024-001001",
            status="open",
            priority="high",
            transfer_reference="TRF-2024-001001",
            transfer_id=transfer_map["TRF-2024-001001"].id
        ),
        # Ticket for account number mismatch (Scenario 2)
        ZendeskTicket(
            ticket_number="ZEN-892456",
            customer_name="Jennifer Wilson",
            customer_email="jwilson@email.com",
            subject="Transfer Status Inquiry - RBC TFSA",
            description="Hello, I'm waiting for my TFSA transfer from RBC. It's been over a week now. Please provide an update. Transfer reference: TRF-2024-001002",
            status="open",
            priority="normal",
            transfer_reference="TRF-2024-001002",
            transfer_id=transfer_map["TRF-2024-001002"].id
        ),
        # Ticket for wrong account type (Scenario 3)
        ZendeskTicket(
            ticket_number="ZEN-892512",
            customer_name="Robert Martinez",
            customer_email="r.martinez@email.com",
            subject="When will my TFSA transfer complete?",
            description="I submitted my TFSA transfer from Scotiabank 6 days ago. When can I expect it to complete? Ref: TRF-2024-001003",
            status="open",
            priority="normal",
            transfer_reference="TRF-2024-001003",
            transfer_id=transfer_map["TRF-2024-001003"].id
        ),
        # Ticket for amount discrepancy (Scenario 4)
        ZendeskTicket(
            ticket_number="ZEN-892623",
            customer_name="Amanda Lee",
            customer_email="amanda.lee@email.com",
            subject="URGENT: Partial RRSP Transfer Delayed",
            description="My partial RRSP transfer from BMO was supposed to complete 3 days ago. I need these funds for an upcoming purchase. Please expedite! Reference: TRF-2024-001004",
            status="open",
            priority="urgent",
            transfer_reference="TRF-2024-001004",
            transfer_id=transfer_map["TRF-2024-001004"].id
        ),
        # Ticket for transfer type mismatch (Scenario 5)
        ZendeskTicket(
            ticket_number="ZEN-892734",
            customer_name="Christopher Brown",
            customer_email="c.brown@email.com",
            subject="Non-Registered Account Transfer Overdue",
            description="Hello support, my transfer from CIBC is now 5 days overdue. This is a significant amount and I'm getting concerned. Please investigate. TRF-2024-001005",
            status="open",
            priority="high",
            transfer_reference="TRF-2024-001005",
            transfer_id=transfer_map["TRF-2024-001005"].id
        ),
        # Ticket for multiple issues (Scenario 6)
        ZendeskTicket(
            ticket_number="ZEN-892845",
            customer_name="Emily Davis",
            customer_email="emily.d@email.com",
            subject="RESP Transfer Question",
            description="Hi, I started an RESP transfer from National Bank. Just checking on the status. Reference number is TRF-2024-001006. Thanks!",
            status="open",
            priority="low",
            transfer_reference="TRF-2024-001006",
            transfer_id=transfer_map["TRF-2024-001006"].id
        ),
        # Ticket for clean old transfer (Scenario 7)
        ZendeskTicket(
            ticket_number="ZEN-891234",
            customer_name="James Anderson",
            customer_email="j.anderson@email.com",
            subject="20+ Days Waiting for RRSP Transfer",
            description="This is getting ridiculous. I've been waiting over 20 days for my RRSP transfer from Desjardins. The expected date was 10 days ago! I need someone to actually look into this and tell me what's going on. Reference: TRF-2024-001007",
            status="open",
            priority="urgent",
            transfer_reference="TRF-2024-001007",
            transfer_id=transfer_map["TRF-2024-001007"].id
        ),
    ]

    db.add_all(tickets)
    db.commit()
    print(f"Created {len(tickets)} Zendesk tickets")


if __name__ == "__main__":
    run_startup()
