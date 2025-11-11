import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List
import logging

from ..core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails"""
    
    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        from_email: Optional[str] = None
    ) -> bool:
        """Send an email"""
        if not all([settings.SMTP_HOST, settings.SMTP_PORT, settings.SMTP_USER, settings.SMTP_PASSWORD]):
            logger.warning("Email service not configured")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = from_email or settings.SMTP_USER
            msg['To'] = to_email
            
            # Add plain text part
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)
            
            # Add HTML part if provided
            if html_body:
                html_part = MIMEText(html_body, 'html')
                msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    @staticmethod
    def send_otp_email(to_email: str, otp_code: str) -> bool:
        """Send OTP code via email"""
        subject = "Your OTP Code"
        body = f"""
        Hello,
        
        Your OTP code is: {otp_code}
        
        This code will expire in 5 minutes.
        
        If you didn't request this code, please ignore this email.
        
        Best regards,
        {settings.APP_NAME}
        """
        
        html_body = f"""
        <html>
        <body>
            <h2>Your OTP Code</h2>
            <p>Hello,</p>
            <p>Your OTP code is: <strong>{otp_code}</strong></p>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p>Best regards,<br>{settings.APP_NAME}</p>
        </body>
        </html>
        """
        
        return EmailService.send_email(to_email, subject, body, html_body)
    
    @staticmethod
    def send_approval_notification(
        to_email: str,
        approver_name: str,
        request_title: str,
        request_type: str,
        action_url: Optional[str] = None
    ) -> bool:
        """Send approval request notification"""
        subject = f"Approval Required: {request_title}"
        body = f"""
        Hello {approver_name},
        
        You have a new approval request:
        
        Title: {request_title}
        Type: {request_type}
        
        Please review and take action.
        
        """
        
        if action_url:
            body += f"You can review this request here: {action_url}\n"
        
        body += f"""
        Best regards,
        {settings.APP_NAME}
        """
        
        html_body = f"""
        <html>
        <body>
            <h2>Approval Required</h2>
            <p>Hello {approver_name},</p>
            <p>You have a new approval request:</p>
            <ul>
                <li><strong>Title:</strong> {request_title}</li>
                <li><strong>Type:</strong> {request_type}</li>
            </ul>
            <p>Please review and take action.</p>
        """
        
        if action_url:
            html_body += f'<p><a href="{action_url}">Review Request</a></p>'
        
        html_body += f"""
            <p>Best regards,<br>{settings.APP_NAME}</p>
        </body>
        </html>
        """
        
        return EmailService.send_email(to_email, subject, body, html_body)
    
    @staticmethod
    def send_approval_decision(
        to_email: str,
        request_title: str,
        decision: str,
        decision_reason: Optional[str] = None
    ) -> bool:
        """Send approval decision notification"""
        subject = f"Approval Decision: {request_title}"
        
        if decision == "approved":
            body = f"""
            Hello,
            
            Your approval request has been approved:
            
            Title: {request_title}
            
            """
        else:
            body = f"""
            Hello,
            
            Your approval request has been rejected:
            
            Title: {request_title}
            """
            
            if decision_reason:
                body += f"Reason: {decision_reason}\n"
        
        body += f"""
        Best regards,
        {settings.APP_NAME}
        """
        
        html_body = f"""
        <html>
        <body>
            <h2>Approval Decision</h2>
            <p>Hello,</p>
            <p>Your approval request has been <strong>{decision}</strong>:</p>
            <ul>
                <li><strong>Title:</strong> {request_title}</li>
            </ul>
        """
        
        if decision == "rejected" and decision_reason:
            html_body += f'<p><strong>Reason:</strong> {decision_reason}</p>'
        
        html_body += f"""
            <p>Best regards,<br>{settings.APP_NAME}</p>
        </body>
        </html>
        """
        
        return EmailService.send_email(to_email, subject, body, html_body)
    
    @staticmethod
    def send_report_ready(
        to_email: str,
        report_title: str,
        download_url: str
    ) -> bool:
        """Send report ready notification"""
        subject = f"Report Ready: {report_title}"
        body = f"""
        Hello,
        
        Your report is ready for download:
        
        Title: {report_title}
        Download URL: {download_url}
        
        The report will be available for 30 days.
        
        Best regards,
        {settings.APP_NAME}
        """
        
        html_body = f"""
        <html>
        <body>
            <h2>Report Ready</h2>
            <p>Hello,</p>
            <p>Your report is ready for download:</p>
            <ul>
                <li><strong>Title:</strong> {report_title}</li>
                <li><strong>Download:</strong> <a href="{download_url}">Click here to download</a></li>
            </ul>
            <p>The report will be available for 30 days.</p>
            <p>Best regards,<br>{settings.APP_NAME}</p>
        </body>
        </html>
        """
        
        return EmailService.send_email(to_email, subject, body, html_body)
    
    @staticmethod
    def send_system_notification(
        to_email: str,
        title: str,
        message: str
    ) -> bool:
        """Send system notification"""
        subject = f"System Notification: {title}"
        body = f"""
        Hello,
        
        {title}
        
        {message}
        
        Best regards,
        {settings.APP_NAME}
        """
        
        html_body = f"""
        <html>
        <body>
            <h2>{title}</h2>
            <p>{message}</p>
            <p>Best regards,<br>{settings.APP_NAME}</p>
        </body>
        </html>
        """
        
        return EmailService.send_email(to_email, subject, body, html_body)
    
    @staticmethod
    def send_password_reset(
        to_email: str,
        reset_token: str,
        reset_url: str
    ) -> bool:
        """Send password reset email"""
        subject = "Password Reset Request"
        body = f"""
        Hello,
        
        You requested a password reset. Click the link below to reset your password:
        
        {reset_url}?token={reset_token}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        {settings.APP_NAME}
        """
        
        html_body = f"""
        <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>Hello,</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href="{reset_url}?token={reset_token}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Best regards,<br>{settings.APP_NAME}</p>
        </body>
        </html>
        """
        
        return EmailService.send_email(to_email, subject, body, html_body)
    
    @staticmethod
    def send_welcome_email(to_email: str, user_name: str) -> bool:
        """Send welcome email to new users"""
        subject = f"Welcome to {settings.APP_NAME}"
        body = f"""
        Hello {user_name},
        
        Welcome to {settings.APP_NAME}!
        
        Your account has been created successfully. You can now log in and start using the system.
        
        If you have any questions, please don't hesitate to contact us.
        
        Best regards,
        The {settings.APP_NAME} Team
        """
        
        html_body = f"""
        <html>
        <body>
            <h2>Welcome to {settings.APP_NAME}!</h2>
            <p>Hello {user_name},</p>
            <p>Welcome to {settings.APP_NAME}!</p>
            <p>Your account has been created successfully. You can now log in and start using the system.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The {settings.APP_NAME} Team</p>
        </body>
        </html>
        """
        
        return EmailService.send_email(to_email, subject, body, html_body)
