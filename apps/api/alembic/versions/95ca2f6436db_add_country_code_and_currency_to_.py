"""add country_code and currency to locations

Revision ID: 95ca2f6436db
Revises: 781bff9973ee
Create Date: 2026-09-19
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "95ca2f6436db"
down_revision: Union[str, None] = "781bff9973ee"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns with server defaults so existing rows get valid values
    op.add_column(
        "locations",
        sa.Column("country_code", sa.String(length=2), nullable=True),
    )
    op.add_column(
        "locations",
        sa.Column(
            "currency",
            sa.String(length=3),
            nullable=False,
            server_default="USD",
        ),
    )

    # If there was a legacy `country` column, drop it (autogenerate detected this)
    op.execute("ALTER TABLE locations DROP COLUMN IF EXISTS country")


def downgrade() -> None:
    op.add_column(
        "locations",
        sa.Column("country", sa.String(length=100), nullable=True),
    )
    op.drop_column("locations", "currency")
    op.drop_column("locations", "country_code")
