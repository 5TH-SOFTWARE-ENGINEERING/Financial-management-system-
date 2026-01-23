from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base

class FraudFlagStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DISMISSED = "dismissed"

class FraudFlag(Base):
    __tablename__ = "fraud_flags"

    id = Column(Integer, primary_key=True, index=True)
    
    # Reference to the suspicious transaction
    # We use source_type and source_id for flexibility
    source_type = Column(String(50), nullable=False) # "revenue", "expense", "sale"
    source_id = Column(Integer, nullable=False)
    
    # Detection details
    fraud_score = Column(Float, nullable=False) # 0.0 to 1.0 (higher = more suspicious)
    reason = Column(String(500), nullable=False) # e.g., "Amount significantly exceeds category average"
    
    # Status tracking
    status = Column(SQLEnum(FraudFlagStatus), default=FraudFlagStatus.PENDING)
    
    # Administrative actions
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_comments = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    reviewed_by = relationship("User")
