"""add_core_accounting_foundations

Revision ID: b4ff712cb36a
Revises: 5611d6ae138c
Create Date: 2026-01-23 14:15:39.947428

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4ff712cb36a'
down_revision: Union[str, None] = '5611d6ae138c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First, rename the existing journal_entries table to avoid conflicts
    op.rename_table('journal_entries', 'legacy_journal_entries')
    
    # Create currencies table
    op.create_table(
        'currencies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=3), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('symbol', sa.String(length=10), nullable=False),
        sa.Column('decimal_places', sa.Integer(), nullable=False, server_default='2'),
        sa.Column('is_base_currency', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_currencies_code'), 'currencies', ['code'], unique=True)
    
    # Create exchange_rates table
    op.create_table(
        'exchange_rates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('from_currency_id', sa.Integer(), nullable=False),
        sa.Column('to_currency_id', sa.Integer(), nullable=False),
        sa.Column('rate', sa.Float(), nullable=False),
        sa.Column('effective_date', sa.Date(), nullable=False),
        sa.Column('source', sa.String(length=20), nullable=False, server_default='manual'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['from_currency_id'], ['currencies.id'], ),
        sa.ForeignKeyConstraint(['to_currency_id'], ['currencies.id'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_exchange_rates_from_currency_id'), 'exchange_rates', ['from_currency_id'], unique=False)
    op.create_index(op.f('ix_exchange_rates_to_currency_id'), 'exchange_rates', ['to_currency_id'], unique=False)
    op.create_index(op.f('ix_exchange_rates_effective_date'), 'exchange_rates', ['effective_date'], unique=False)
    
    # Create accounts table
    op.create_table(
        'accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('account_type', sa.Enum('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', name='accounttype'), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('parent_account_id', sa.Integer(), nullable=True),
        sa.Column('currency_code', sa.String(length=3), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('is_system_account', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['parent_account_id'], ['accounts.id'], ),
        sa.ForeignKeyConstraint(['currency_code'], ['currencies.code'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accounts_code'), 'accounts', ['code'], unique=True)
    op.create_index(op.f('ix_accounts_account_type'), 'accounts', ['account_type'], unique=False)
    
    # Create tax_types table
    op.create_table(
        'tax_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tax_types_code'), 'tax_types', ['code'], unique=True)
    
    # Create tax_rates table
    op.create_table(
        'tax_rates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tax_type_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('rate_percentage', sa.Float(), nullable=False),
        sa.Column('jurisdiction', sa.String(length=100), nullable=True),
        sa.Column('effective_from', sa.DateTime(timezone=True), nullable=False),
        sa.Column('effective_to', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['tax_type_id'], ['tax_types.id'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tax_rates_tax_type_id'), 'tax_rates', ['tax_type_id'], unique=False)
    op.create_index(op.f('ix_tax_rates_effective_from'), 'tax_rates', ['effective_from'], unique=False)
    op.create_index(op.f('ix_tax_rates_effective_to'), 'tax_rates', ['effective_to'], unique=False)
    
    # Create tax_components table
    op.create_table(
        'tax_components',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.Enum('REVENUE', 'EXPENSE', 'SALE', name='transactiontype'), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('tax_rate_id', sa.Integer(), nullable=False),
        sa.Column('taxable_amount', sa.Float(), nullable=False),
        sa.Column('tax_amount', sa.Float(), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['tax_rate_id'], ['tax_rates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tax_components_transaction_type'), 'tax_components', ['transaction_type'], unique=False)
    op.create_index(op.f('ix_tax_components_transaction_id'), 'tax_components', ['transaction_id'], unique=False)
    op.create_index(op.f('ix_tax_components_tax_rate_id'), 'tax_components', ['tax_rate_id'], unique=False)
    
    # Create new accounting_journal_entries table
    op.create_table(
        'accounting_journal_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entry_number', sa.String(length=50), nullable=False),
        sa.Column('entry_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('reference_type', sa.Enum('REVENUE', 'EXPENSE', 'SALE', 'INVENTORY', 'MANUAL', 'OPENING_BALANCE', 'ADJUSTMENT', name='referencetype'), nullable=False),
        sa.Column('reference_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('DRAFT', 'POSTED', 'REVERSED', name='journalentrystatus'), nullable=False, server_default='DRAFT'),
        sa.Column('posted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('posted_by_id', sa.Integer(), nullable=True),
        sa.Column('reversed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reversed_by_id', sa.Integer(), nullable=True),
        sa.Column('reversal_entry_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['posted_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['reversed_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accounting_journal_entries_entry_number'), 'accounting_journal_entries', ['entry_number'], unique=True)
    op.create_index(op.f('ix_accounting_journal_entries_entry_date'), 'accounting_journal_entries', ['entry_date'], unique=False)
    op.create_index(op.f('ix_accounting_journal_entries_reference_type'), 'accounting_journal_entries', ['reference_type'], unique=False)
    op.create_index(op.f('ix_accounting_journal_entries_status'), 'accounting_journal_entries', ['status'], unique=False)
    
    # Add self-referential foreign key after table creation
    op.create_foreign_key('fk_reversal_entry', 'accounting_journal_entries', 'accounting_journal_entries', ['reversal_entry_id'], ['id'])
    
    # Create accounting_journal_entry_lines table
    op.create_table(
        'accounting_journal_entry_lines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('journal_entry_id', sa.Integer(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('debit_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('credit_amount', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['journal_entry_id'], ['accounting_journal_entries.id'], ),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accounting_journal_entry_lines_journal_entry_id'), 'accounting_journal_entry_lines', ['journal_entry_id'], unique=False)
    op.create_index(op.f('ix_accounting_journal_entry_lines_account_id'), 'accounting_journal_entry_lines', ['account_id'], unique=False)
    
    # Add currency and tax columns to revenue_entries
    op.add_column('revenue_entries', sa.Column('currency_id', sa.Integer(), nullable=True))
    op.add_column('revenue_entries', sa.Column('exchange_rate', sa.Float(), nullable=True))
    op.add_column('revenue_entries', sa.Column('amount_base_currency', sa.Float(), nullable=True))
    op.add_column('revenue_entries', sa.Column('tax_rate_id', sa.Integer(), nullable=True))
    op.add_column('revenue_entries', sa.Column('tax_amount', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('revenue_entries', sa.Column('amount_before_tax', sa.Float(), nullable=True))
    op.create_foreign_key('fk_revenue_currency', 'revenue_entries', 'currencies', ['currency_id'], ['id'])
    op.create_foreign_key('fk_revenue_tax_rate', 'revenue_entries', 'tax_rates', ['tax_rate_id'], ['id'])
    
    # Add currency and tax columns to expense_entries
    op.add_column('expense_entries', sa.Column('currency_id', sa.Integer(), nullable=True))
    op.add_column('expense_entries', sa.Column('exchange_rate', sa.Float(), nullable=True))
    op.add_column('expense_entries', sa.Column('amount_base_currency', sa.Float(), nullable=True))
    op.add_column('expense_entries', sa.Column('tax_rate_id', sa.Integer(), nullable=True))
    op.add_column('expense_entries', sa.Column('tax_amount', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('expense_entries', sa.Column('amount_before_tax', sa.Float(), nullable=True))
    op.create_foreign_key('fk_expense_currency', 'expense_entries', 'currencies', ['currency_id'], ['id'])
    op.create_foreign_key('fk_expense_tax_rate', 'expense_entries', 'tax_rates', ['tax_rate_id'], ['id'])


def downgrade() -> None:
    # Remove foreign keys and columns from expense_entries
    op.drop_constraint('fk_expense_tax_rate', 'expense_entries', type_='foreignkey')
    op.drop_constraint('fk_expense_currency', 'expense_entries', type_='foreignkey')
    op.drop_column('expense_entries', 'amount_before_tax')
    op.drop_column('expense_entries', 'tax_amount')
    op.drop_column('expense_entries', 'tax_rate_id')
    op.drop_column('expense_entries', 'amount_base_currency')
    op.drop_column('expense_entries', 'exchange_rate')
    op.drop_column('expense_entries', 'currency_id')
    
    # Remove foreign keys and columns from revenue_entries
    op.drop_constraint('fk_revenue_tax_rate', 'revenue_entries', type_='foreignkey')
    op.drop_constraint('fk_revenue_currency', 'revenue_entries', type_='foreignkey')
    op.drop_column('revenue_entries', 'amount_before_tax')
    op.drop_column('revenue_entries', 'tax_amount')
    op.drop_column('revenue_entries', 'tax_rate_id')
    op.drop_column('revenue_entries', 'amount_base_currency')
    op.drop_column('revenue_entries', 'exchange_rate')
    op.drop_column('revenue_entries', 'currency_id')
    
    # Drop tables in reverse order
    op.drop_index(op.f('ix_accounting_journal_entry_lines_account_id'), table_name='accounting_journal_entry_lines')
    op.drop_index(op.f('ix_accounting_journal_entry_lines_journal_entry_id'), table_name='accounting_journal_entry_lines')
    op.drop_table('accounting_journal_entry_lines')
    
    op.drop_index(op.f('ix_accounting_journal_entries_status'), table_name='accounting_journal_entries')
    op.drop_index(op.f('ix_accounting_journal_entries_reference_type'), table_name='accounting_journal_entries')
    op.drop_index(op.f('ix_accounting_journal_entries_entry_date'), table_name='accounting_journal_entries')
    op.drop_index(op.f('ix_accounting_journal_entries_entry_number'), table_name='accounting_journal_entries')
    op.drop_table('accounting_journal_entries')
    
    op.drop_index(op.f('ix_tax_components_tax_rate_id'), table_name='tax_components')
    op.drop_index(op.f('ix_tax_components_transaction_id'), table_name='tax_components')
    op.drop_index(op.f('ix_tax_components_transaction_type'), table_name='tax_components')
    op.drop_table('tax_components')
    
    op.drop_index(op.f('ix_tax_rates_effective_to'), table_name='tax_rates')
    op.drop_index(op.f('ix_tax_rates_effective_from'), table_name='tax_rates')
    op.drop_index(op.f('ix_tax_rates_tax_type_id'), table_name='tax_rates')
    op.drop_table('tax_rates')
    
    op.drop_index(op.f('ix_tax_types_code'), table_name='tax_types')
    op.drop_table('tax_types')
    
    op.drop_index(op.f('ix_accounts_account_type'), table_name='accounts')
    op.drop_index(op.f('ix_accounts_code'), table_name='accounts')
    op.drop_table('accounts')
    
    op.drop_index(op.f('ix_exchange_rates_effective_date'), table_name='exchange_rates')
    op.drop_index(op.f('ix_exchange_rates_to_currency_id'), table_name='exchange_rates')
    op.drop_index(op.f('ix_exchange_rates_from_currency_id'), table_name='exchange_rates')
    op.drop_table('exchange_rates')
    
    op.drop_index(op.f('ix_currencies_code'), table_name='currencies')
    op.drop_table('currencies')
    
    # Restore the original journal_entries table
    op.rename_table('legacy_journal_entries', 'journal_entries')
