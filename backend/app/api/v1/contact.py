# app/api/v1/contact.py
"""
Contact form API endpoint
Allows users to submit contact/support messages via email
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging

from ...services.email import EmailService
from ...core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str


class ContactResponse(BaseModel):
    message: str
    success: bool


@router.post("/", response_model=ContactResponse, status_code=status.HTTP_200_OK)
def submit_contact(request: ContactRequest):
    """
    Submit a contact/support message
    
    This endpoint sends an email to the support team with the contact form submission.
    The email is sent to the configured support email address (or SMTP_FROM_EMAIL if set).
    """
    try:
        # Validate input
        if not request.name or not request.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name is required"
            )
        
        if not request.email or not request.email.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required"
            )
        
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message is required"
            )
        
        # Determine recipient email
        # Use SMTP_FROM_EMAIL if set, otherwise use SMTP_USER, or fallback to a default
        support_email = (
            settings.SMTP_FROM_EMAIL or 
            settings.SMTP_USER or 
            "support@finmgmt.co"
        )
        
        # Prepare email content
        subject = f"Contact Form Submission from {request.name}"
        
        # Plain text body
        body = f"""
New contact form submission:

Name: {request.name}
Email: {request.email}

Message:
{request.message}

---
This message was sent from the {settings.APP_NAME} contact form.
        """.strip()
        
        # HTML body
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #3b82f6;">New Contact Form Submission</h2>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> {request.name}</p>
                <p><strong>Email:</strong> <a href="mailto:{request.email}">{request.email}</a></p>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <h3 style="margin-top: 0;">Message:</h3>
                <p style="white-space: pre-wrap;">{request.message}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px;">
                This message was sent from the {settings.APP_NAME} contact form.
            </p>
        </body>
        </html>
        """
        
        # Send email to support team
        email_sent, error_detail = EmailService.send_email(
            to_email=support_email,
            subject=subject,
            body=body,
            html_body=html_body,
            from_email=request.email  # Reply-to will be the sender's email
        )
        
        if not email_sent:
            logger.error(f"Failed to send contact form email: {error_detail}")
            # Still return success to user, but log the error
            # This prevents exposing internal email configuration issues
            return ContactResponse(
                message="Thank you for your message. We have received it and will get back to you soon.",
                success=True
            )
        
        logger.info(f"Contact form submission received from {request.name} ({request.email})")
        
        # Optionally send a confirmation email to the user
        try:
            confirmation_subject = f"Thank you for contacting {settings.APP_NAME}"
            confirmation_body = f"""
Hello {request.name},

Thank you for reaching out to us. We have received your message and will get back to you within 1-2 business days.

Your message:
{request.message}

If you have any urgent questions, please don't hesitate to contact us directly.

Best regards,
The {settings.APP_NAME} Team
            """.strip()
            
            confirmation_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #3b82f6;">Thank you for contacting {settings.APP_NAME}</h2>
                <p>Hello {request.name},</p>
                <p>Thank you for reaching out to us. We have received your message and will get back to you within 1-2 business days.</p>
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Your message:</strong></p>
                    <p style="white-space: pre-wrap;">{request.message}</p>
                </div>
                <p>If you have any urgent questions, please don't hesitate to contact us directly.</p>
                <p>Best regards,<br>The {settings.APP_NAME} Team</p>
            </body>
            </html>
            """
            
            EmailService.send_email(
                to_email=request.email,
                subject=confirmation_subject,
                body=confirmation_body,
                html_body=confirmation_html
            )
        except Exception as e:
            # Log but don't fail if confirmation email fails
            logger.warning(f"Failed to send confirmation email to {request.email}: {str(e)}")
        
        return ContactResponse(
            message="Thank you for your message. We have received it and will get back to you soon.",
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing contact form: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your message. Please try again later."
        )

