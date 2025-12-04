import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Tuple
import logging
import socket

from ..core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails"""
    
    @staticmethod
    def _test_connection(host: str, port: int, timeout: int = 5) -> Tuple[bool, Optional[str]]:
        """Test if SMTP host/port is reachable"""
        try:
            # First, try to resolve the hostname
            try:
                socket.gethostbyname(host)
            except socket.gaierror as dns_error:
                return False, f"DNS resolution failed: {str(dns_error)}. Try flushing DNS cache or restarting."
            
            # Then test the connection
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((host, port))
            sock.close()
            if result == 0:
                return True, None
            else:
                return False, f"Port {port} is not open or host is unreachable"
        except socket.gaierror as e:
            return False, f"DNS resolution failed: {str(e)}. Try flushing DNS cache: 'ipconfig /flushdns' (Windows)"
        except socket.timeout:
            return False, f"Connection timeout after {timeout} seconds"
        except Exception as e:
            return False, f"Connection test failed: {str(e)}"
    
    @staticmethod
    def is_configured() -> bool:
        """Check if email service is properly configured"""
        try:
            # Check all required fields are present and not empty
            has_host = settings.SMTP_HOST and isinstance(settings.SMTP_HOST, str) and settings.SMTP_HOST.strip()
            has_port = settings.SMTP_PORT and isinstance(settings.SMTP_PORT, int) and 0 < settings.SMTP_PORT <= 65535
            has_user = settings.SMTP_USER and isinstance(settings.SMTP_USER, str) and settings.SMTP_USER.strip()
            has_password = settings.SMTP_PASSWORD and isinstance(settings.SMTP_PASSWORD, str) and settings.SMTP_PASSWORD.strip()
            
            is_configured = all([has_host, has_port, has_user, has_password])
            
            if not is_configured:
                logger.warning(
                    f"Email service not fully configured - "
                    f"HOST: {bool(has_host)}, PORT: {bool(has_port)}, "
                    f"USER: {bool(has_user)}, PASSWORD: {bool(has_password)}"
                )
            else:
                logger.info(f"Email service configured - HOST: {settings.SMTP_HOST}, PORT: {settings.SMTP_PORT}")
            
            return is_configured
        except Exception as e:
            logger.error(f"Error checking email configuration: {str(e)}", exc_info=True)
            return False
    
    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        from_email: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Send an email
        
        Returns:
            Tuple[bool, Optional[str]]: (success, error_message)
        """
        if not EmailService.is_configured():
            error_msg = "Email service is not configured. Please check SMTP settings."
            logger.warning(error_msg)
            return False, error_msg
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = from_email or settings.SMTP_USER
            msg['To'] = to_email
            
            # Add plain text part
            text_part = MIMEText(body, 'plain', 'utf-8')
            msg.attach(text_part)
            
            # Add HTML part if provided
            if html_body:
                html_part = MIMEText(html_body, 'html', 'utf-8')
                msg.attach(html_part)
            
            # Send email with proper error handling
            try:
                logger.info(f"Connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}")
                
                # Determine if we should use SSL (port 465) or STARTTLS (port 587)
                use_ssl = settings.SMTP_PORT == 465
                
                if use_ssl:
                    # Use SSL connection for port 465
                    logger.debug("Using SSL connection (port 465)...")
                    server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30)
                    server.set_debuglevel(1 if settings.DEBUG else 0)
                else:
                    # Use STARTTLS for port 587
                    logger.debug("Using STARTTLS connection (port 587)...")
                    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30)
                    server.set_debuglevel(1 if settings.DEBUG else 0)
                    # Start TLS encryption
                    logger.debug("Starting TLS encryption...")
                    server.starttls()
                
                # Login with credentials
                logger.debug(f"Logging in as {settings.SMTP_USER}...")
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                
                # Send the message
                logger.info(f"Sending email to {to_email}...")
                send_result = server.send_message(msg)
                
                # Close connection
                server.quit()
                
                logger.info(f"Email sent successfully to {to_email}")
                if send_result:
                    logger.warning(f"SMTP server returned non-empty result: {send_result}")
                
                return True, None
                    
            except smtplib.SMTPAuthenticationError as e:
                # Provide Brevo-specific guidance if using Brevo
                is_brevo = "brevo" in settings.SMTP_HOST.lower()
                if is_brevo:
                    error_msg = (
                        f"SMTP authentication failed with Brevo. "
                        f"Please verify: "
                        f"1. SMTP_USER should be your Brevo SMTP login (format: 'xxxxx@smtp-brevo.com' or your Brevo account email). "
                        f"2. SMTP_PASSWORD should be your Brevo SMTP key (starts with 'xsmtpsib-'). "
                        f"3. Get your SMTP key from Brevo dashboard -> Settings -> SMTP & API. "
                        f"4. Make sure the SMTP key is active and not expired. "
                        f"5. Verify your Brevo account email is verified. "
                        f"Error: {str(e)}"
                    )
                else:
                    error_msg = f"SMTP authentication failed. Please check your SMTP_USER and SMTP_PASSWORD. Error: {str(e)}"
                logger.error(error_msg)
                return False, error_msg
                
            except smtplib.SMTPConnectError as e:
                is_brevo = "brevo" in settings.SMTP_HOST.lower()
                error_msg = (
                    f"Cannot connect to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}. "
                    f"Check network/firewall settings. "
                )
                if is_brevo:
                    error_msg += (
                        f"For Brevo, ensure you're using 'smtp-relay.brevo.com' (not 'smtp.brevo.com'). "
                        f"If port 587 is blocked, try port 465 with SSL. "
                    )
                error_msg += f"Error: {str(e)}"
                logger.error(error_msg)
                return False, error_msg
                
            except smtplib.SMTPServerDisconnected as e:
                error_msg = f"SMTP server disconnected unexpectedly. Error: {str(e)}"
                logger.error(error_msg)
                return False, error_msg
                
            except smtplib.SMTPRecipientsRefused as e:
                error_msg = f"SMTP server refused recipient {to_email}. Error: {str(e)}"
                logger.error(error_msg)
                return False, error_msg
                
            except smtplib.SMTPDataError as e:
                error_msg = f"SMTP server rejected message data. Error: {str(e)}"
                logger.error(error_msg)
                return False, error_msg
                
            except smtplib.SMTPException as e:
                error_msg = f"SMTP error occurred: {str(e)}"
                logger.error(error_msg)
                return False, error_msg
                
            except socket.timeout as e:
                is_brevo = "brevo" in settings.SMTP_HOST.lower()
                error_msg = (
                    f"Connection timeout while connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}. "
                    f"This usually indicates a firewall or network issue. "
                    f"Troubleshooting steps: "
                    f"1. Check Windows Firewall allows outbound connections on port {settings.SMTP_PORT}. "
                    f"2. Check if your network/ISP blocks SMTP ports (some networks block port 587). "
                    f"3. Try using a VPN if you're on a restricted network. "
                    f"4. Verify the SMTP host is correct: {settings.SMTP_HOST}. "
                )
                if is_brevo:
                    if settings.SMTP_PORT == 587:
                        error_msg += (
                            f"5. For Brevo, try port 465 with SSL instead of port 587. "
                            f"   Update your .env: SMTP_PORT=465 (the code will automatically use SSL). "
                            f"6. Check Brevo dashboard to ensure your SMTP account is active. "
                        )
                    else:
                        error_msg += (
                            f"5. Check Brevo dashboard to ensure your SMTP account is active. "
                            f"6. Try port 587 with STARTTLS if port 465 is blocked. "
                        )
                error_msg += f"Technical error: {str(e)}"
                logger.error(error_msg)
                return False, error_msg
                
            except socket.gaierror as e:
                # DNS resolution failed - try to provide helpful troubleshooting
                is_brevo = "brevo" in settings.SMTP_HOST.lower()
                error_msg = (
                    f"DNS resolution failed for SMTP host {settings.SMTP_HOST}. "
                    f"This means Python cannot resolve the hostname. "
                    f"Troubleshooting steps: "
                    f"1. Verify the SMTP_HOST is correct: {settings.SMTP_HOST}. "
                    f"2. Check your internet connection is working. "
                    f"3. Try flushing DNS cache: 'ipconfig /flushdns' (Windows) or 'sudo dscacheutil -flushcache' (Mac). "
                    f"4. Restart your computer if DNS issues persist. "
                )
                if is_brevo:
                    error_msg += (
                        f"5. For Brevo, verify the hostname in your Brevo dashboard. "
                        f"6. Try using 'smtp.brevo.com' as an alternative (if supported by your account). "
                    )
                error_msg += f"Technical error: {str(e)}"
                logger.error(error_msg)
                return False, error_msg
                
            except Exception as e:
                error_msg = f"Unexpected error sending email: {str(e)}"
                logger.error(error_msg, exc_info=True)
                return False, error_msg
                
        except Exception as e:
            error_msg = f"Failed to prepare email message: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return False, error_msg
    
    @staticmethod
    def send_otp_email(to_email: str, otp_code: str) -> Tuple[bool, Optional[str]]:
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
        
        success, _ = EmailService.send_email(to_email, subject, body, html_body)
        return success
    
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
        
        success, _ = EmailService.send_email(to_email, subject, body, html_body)
        return success
    
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
        
        success, _ = EmailService.send_email(to_email, subject, body, html_body)
        return success
    
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
        
        success, _ = EmailService.send_email(to_email, subject, body, html_body)
        return success
    
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
        
        success, _ = EmailService.send_email(to_email, subject, body, html_body)
        return success
    
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
        
        success, _ = EmailService.send_email(to_email, subject, body, html_body)
        return success