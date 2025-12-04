# app/utils/user_agent.py
"""Utility functions for parsing user agent strings"""
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def get_device_info(user_agent: str) -> str:
    """Parse user agent and return device/browser info"""
    if not user_agent:
        return "Unknown Device"
    
    user_agent_lower = user_agent.lower()
    
    # Browser detection
    browser = "Unknown Browser"
    if "chrome" in user_agent_lower and "edg" not in user_agent_lower:
        browser = "Chrome"
    elif "firefox" in user_agent_lower:
        browser = "Firefox"
    elif "safari" in user_agent_lower and "chrome" not in user_agent_lower:
        browser = "Safari"
    elif "edg" in user_agent_lower:
        browser = "Edge"
    elif "opera" in user_agent_lower or "opr" in user_agent_lower:
        browser = "Opera"
    
    # OS detection
    os_name = "Unknown OS"
    if "windows" in user_agent_lower:
        os_name = "Windows"
        # Try to detect Windows version
        if "windows nt 10.0" in user_agent_lower:
            os_name = "Windows 10/11"
        elif "windows nt 6.3" in user_agent_lower:
            os_name = "Windows 8.1"
        elif "windows nt 6.2" in user_agent_lower:
            os_name = "Windows 8"
        elif "windows nt 6.1" in user_agent_lower:
            os_name = "Windows 7"
    elif "mac os x" in user_agent_lower or "macintosh" in user_agent_lower:
        os_name = "macOS"
    elif "linux" in user_agent_lower:
        os_name = "Linux"
    elif "android" in user_agent_lower:
        os_name = "Android"
    elif "ios" in user_agent_lower or "iphone" in user_agent_lower or "ipad" in user_agent_lower:
        os_name = "iOS"
    
    # Mobile detection
    is_mobile = any(mobile in user_agent_lower for mobile in ["mobile", "android", "iphone", "ipad", "ipod", "blackberry"])
    
    if is_mobile:
        return f"{browser} on {os_name} (Mobile)"
    else:
        return f"{browser} on {os_name}"


def get_location_from_ip(ip_address: str) -> str:
    """
    Get location from IP address using ip-api.com (free tier).
    Falls back to 'Unknown' if service is unavailable or IP is invalid.
    """
    if not ip_address:
        return "Unknown"
    
    # For localhost/127.0.0.1, return local
    if ip_address in ["127.0.0.1", "localhost", "::1", "0.0.0.0"]:
        return "Local"
    
    # Try to get location from ip-api.com (free, no API key required)
    try:
        import requests  # type: ignore
        from requests.adapters import HTTPAdapter  # type: ignore
        from urllib3.util.retry import Retry  # type: ignore
        
        # Create session with retry strategy
        session = requests.Session()
        retry_strategy = Retry(
            total=1,
            backoff_factor=0.1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # ip-api.com free endpoint (no API key needed, 45 requests/minute limit)
        # Using JSON endpoint for better error handling
        response = session.get(
            f"http://ip-api.com/json/{ip_address}",
            timeout=2,  # Short timeout to avoid blocking
            params={"fields": "status,country,regionName,city"}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                parts = []
                if data.get("city"):
                    parts.append(data["city"])
                if data.get("regionName"):
                    parts.append(data["regionName"])
                if data.get("country"):
                    parts.append(data["country"])
                
                if parts:
                    return ", ".join(parts)
        
        # If we get here, the service returned an error or invalid response
        return "Unknown"
        
    except ImportError:
        # requests library not available - return Unknown
        logger.debug("requests library not available for IP geolocation")
        return "Unknown"
    except Exception as e:
        # Any other error (network, timeout, etc.) - return Unknown
        logger.debug(f"Failed to get location from IP {ip_address}: {str(e)}")
        return "Unknown"

