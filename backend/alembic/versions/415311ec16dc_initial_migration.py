"""Initial migration

Revision ID: 415311ec16dc
Revises: 
Create Date: 2025-12-20 18:55:28.309641

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '415311ec16dc'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Empty migration - all tables are created in the next migration
    # This migration was incorrectly auto-generated
    pass


def downgrade() -> None:
    # Empty migration - all tables are dropped in the next migration
    pass
