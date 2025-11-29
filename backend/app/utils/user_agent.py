# app/utils/user_agent.py
"""Utility functions for parsing user agent strings"""
import re


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
    """Get location from IP address. Returns a placeholder for now."""
    # In a real implementation, you would use a geolocation service
    # like MaxMind GeoIP2, ipapi.co, or ip-api.com
    if not ip_address:
        return "Unknown"
    
    # For localhost/127.0.0.1, return local
    if ip_address in ["127.0.0.1", "localhost", "::1"]:
        return "Local"
    
    # Placeholder - in production, implement actual geolocation
    return "Unknown"

