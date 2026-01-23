from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base

class AccountMapping(Base):
    __tablename__ = "account_mappings"

    id = Column(Integer, primary_key=True, index=True)
    
    # Module determines the source (e.g., 'payroll', 'revenue', 'expense', 'inventory')
    module = Column(String(50), nullable=False, index=True)
    
    # Category is the specific category within that module (e.g., 'salary', 'software', 'damage')
    category = Column(String(100), nullable=False, index=True)
    
    # The actual GL account to map to
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    account = relationship("Account")
    created_by = relationship("User")

    def __repr__(self):
        return f"<AccountMapping {self.module}:{self.category} -> {self.account_id}>"
