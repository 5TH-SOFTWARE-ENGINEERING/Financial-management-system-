# # backend/app/__init__.py (comment out startup temporarily to avoid bcrypt error)
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from .core.config import settings
# from .api.v1.api import api_router
# from .db.session import engine, SessionLocal
# from .db.base import Base
# from .crud.user import create_user, get_user_by_email
# from .schemas.user import UserCreate
# from .db.models.user import Role

# app = FastAPI(title="Intelligent Expense Tracking System", version="1.0.0")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[settings.FRONTEND_URL],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(api_router, prefix="/api/v1")

# # Create tables
# Base.metadata.create_all(bind=engine)

# Temporarily comment out default admin creation due to bcrypt compatibility issue
# @app.on_event("startup")
# def create_default_admin():
#     db = SessionLocal()
#     try:
#         admin_email = "admin@expense.com"
#         admin_pass = "admin123"
#         admin = get_user_by_email(db, admin_email)
#         if not admin:
#             user_create = UserCreate(email=admin_email, password=admin_pass, role=Role.ADMIN)
#             create_user(db, user_create)
#             print(f"Default admin created: {admin_email}/{admin_pass}")
#     finally:
#         db.close()