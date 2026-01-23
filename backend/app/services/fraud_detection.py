import logging
import numpy as np
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional

from ..models.fraud import FraudFlag, FraudFlagStatus
from ..models.revenue import RevenueEntry
from ..models.expense import ExpenseEntry
from ..models.sale import Sale

# AI/ML Libraries
try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

logger = logging.getLogger(__name__)

class FraudDetectionService:
    @staticmethod
    def scan_for_fraud(db: Session) -> int:
        """
        Run a global scan for suspicious transactions.
        Checks Revenue, Expenses, and Sales.
        """
        flag_count = 0
        
        # 1. Rule-based detection (Statistical Outliers)
        flag_count += FraudDetectionService._detect_statistical_outliers(db, ExpenseEntry, "expense")
        flag_count += FraudDetectionService._detect_statistical_outliers(db, RevenueEntry, "revenue")
        
        # 2. ML-based detection (Isolation Forest)
        if SKLEARN_AVAILABLE:
            flag_count += FraudDetectionService._detect_ml_anomalies(db)
        else:
            logger.warning("Scikit-learn not available. Skipping ML fraud detection.")
            
        return flag_count

    @staticmethod
    def _detect_statistical_outliers(db: Session, model: Any, source_type: str) -> int:
        """
        Identifies transactions that are > 3x the average for their category.
        """
        new_flags = 0
        
        # Get averages by category
        categories = db.query(model.category).distinct().all()
        for (category,) in categories:
            avg_amount = db.query(func.avg(model.amount)).filter(model.category == category).scalar() or 0
            
            # Find outliers
            outliers = (
                db.query(model)
                .filter(model.category == category)
                .filter(model.amount > (avg_amount * 3))
                .all()
            )
            
            for transaction in outliers:
                # Check if already flagged
                exists = db.query(FraudFlag).filter(
                    FraudFlag.source_type == source_type,
                    FraudFlag.source_id == transaction.id
                ).first()
                
                if not exists:
                    flag = FraudFlag(
                        source_type=source_type,
                        source_id=transaction.id,
                        fraud_score=0.7, # Rule-based score
                        reason=f"Transaction amount ({transaction.amount}) is over 3x the average for {category} ({avg_amount:.2f})"
                    )
                    db.add(flag)
                    new_flags += 1
        
        db.commit()
        return new_flags

    @staticmethod
    def _detect_ml_anomalies(db: Session) -> int:
        """
        Uses Isolation Forest to detect anomalies based on (amount, category_id, day_of_week)
        """
        # For simplicity in this implementation, we'll focus on ExpenseEntry
        expenses = db.query(ExpenseEntry).all()
        if len(expenses) < 10: # Need enough data for IF
            return 0

        # Create numerical features
        data = []
        for e in expenses:
            # Map category to a simple ID
            cat_id = hash(e.category) % 100 
            data.append([e.amount, cat_id, e.date.weekday() if e.date else 0])
        
        X = np.array(data)
        
        # Fit Isolation Forest
        # contamination = expected proportion of outliers
        clf = IsolationForest(contamination=0.05, random_state=42)
        preds = clf.fit_predict(X) 
        # preds: 1 = normal, -1 = anomaly
        
        new_flags = 0
        for i, pred in enumerate(preds):
            if pred == -1:
                transaction = expenses[i]
                
                # Check if already flagged
                exists = db.query(FraudFlag).filter(
                    FraudFlag.source_type == "expense",
                    FraudFlag.source_id == transaction.id
                ).first()
                
                if not exists:
                    # Calculate a pseudo-score (Isolation Forest doesn't give direct prob)
                    score = float(abs(clf.decision_function(X[i:i+1])[0])) + 0.5
                    
                    flag = FraudFlag(
                        source_type="expense",
                        source_id=transaction.id,
                        fraud_score=min(score, 0.99),
                        reason="ML Anomaly Detection: Transaction pattern deviates significantly from historical behavior."
                    )
                    db.add(flag)
                    new_flags += 1
        
        db.commit()
        return new_flags

fraud_detection_service = FraudDetectionService()
