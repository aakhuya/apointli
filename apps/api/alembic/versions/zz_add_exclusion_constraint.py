"""add exclusion constraint to appointments

Revision ID: zz_excl_001
Revises: 7d508dadf6d0
Create Date: 2026-09-21
"""
from typing import Sequence, Union

from alembic import op

revision: str = "zz_excl_001"
down_revision: Union[str, None] = "7d508dadf6d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # btree_gist is required for combining equality (=) with range overlap (&&)
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    # Prevent overlapping appointments for the same staff member.
    # Only applies when the appointment is "active" (not cancelled/no-show).
    op.execute("""
        ALTER TABLE appointments
        ADD CONSTRAINT no_overlapping_appointments
        EXCLUDE USING gist (
            staff_id WITH =,
            tstzrange(start_time, end_time, '[)') WITH &&
        )
        WHERE (status IN ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'))
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS no_overlapping_appointments")
