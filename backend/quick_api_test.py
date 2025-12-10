"""
Quick API Test to verify the Finance Management System endpoints are working
This script tests basic functionality without running the full hierarchy test suite
"""

import requests #type: ignore
import json

def test_api_endpoints():
    """Test basic API endpoints to verify they're working"""
    base_url = "http://localhost:8000"
    
    print("🧪 Quick API Test - Finance Management System")
    print("=" * 50)
    
    try:
        # Test 1: Health Check
        print("\n1. Testing Health Check...")
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check working")
            print(f"   Status: {response.json()['status']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
        
        # Test 2: Root Endpoint
        print("\n2. Testing Root Endpoint...")
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code == 200:
            print("✅ Root endpoint working")
            print(f"   API: {response.json()['message']}")
        else:
            print(f"❌ Root endpoint failed: {response.status_code}")
            return False
        
        # Test 3: API Info
        print("\n3. Testing API Info...")
        response = requests.get(f"{base_url}/api/info", timeout=5)
        if response.status_code == 200:
            info = response.json()
            print("✅ API info working")
            print(f"   Name: {info['name']}")
            print(f"   Version: {info['version']}")
            print(f"   Endpoints: {len(info['endpoints'])} available")
        else:
            print(f"❌ API info failed: {response.status_code}")
            return False
        
        # Test 4: OpenAPI Documentation (if debug mode)
        print("\n4. Testing OpenAPI Documentation...")
        response = requests.get(f"{base_url}/openapi.json", timeout=5)
        if response.status_code == 200:
            openapi = response.json()
            print("✅ OpenAPI documentation working")
            print(f"   Title: {openapi['info']['title']}")
            print(f"   Version: {openapi['info']['version']}")
            print(f"   Paths: {len(openapi['paths'])} endpoints")
        else:
            print(f"⚠️  OpenAPI documentation not available (production mode)")
        
        print("\n" + "=" * 50)
        print("🎉 BASIC API TESTS PASSED!")
        print("✅ All core endpoints are responding correctly")
        print("✅ The Finance Management System API is working")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection Error: Could not connect to the API")
        print("   Make sure the server is running on http://localhost:8000")
        print("   Run: uvicorn app.main:app --reload")
        return False
        
    except Exception as e:
        print(f"\n❌ Unexpected Error: {str(e)}")
        return False

def show_api_structure():
    """Show the complete API structure"""
    print("\n📋 Complete API Structure:")
    print("=" * 30)
    
    endpoints = {
        "Authentication": [
            "POST /api/v1/auth/login",
            "POST /api/v1/auth/register", 
            "POST /api/v1/auth/generate-otp",
            "POST /api/v1/auth/verify-otp",
            "POST /api/v1/auth/refresh-token"
        ],
        "Users": [
            "GET /api/v1/users/me",
            "PUT /api/v1/users/me",
            "GET /api/v1/users/",
            "POST /api/v1/users/",
            "PUT /api/v1/users/{user_id}",
            "DELETE /api/v1/users/{user_id}",
            "POST /api/v1/users/subordinates",
            "GET /api/v1/users/{user_id}/subordinates",
            "POST /api/v1/users/{user_id}/delegate-action",
            "POST /api/v1/users/{user_id}/override-action",
            "GET /api/v1/users/hierarchy-tree"
        ],
        "Revenue": [
            "GET /api/v1/revenue/",
            "POST /api/v1/revenue/",
            "GET /api/v1/revenue/{revenue_id}",
            "PUT /api/v1/revenue/{revenue_id}",
            "DELETE /api/v1/revenue/{revenue_id}",
            "POST /api/v1/revenue/{revenue_id}/approve",
            "GET /api/v1/revenue/summary"
        ],
        "Expenses": [
            "GET /api/v1/expenses/",
            "POST /api/v1/expenses/",
            "GET /api/v1/expenses/{expense_id}",
            "PUT /api/v1/expenses/{expense_id}",
            "DELETE /api/v1/expenses/{expense_id}",
            "POST /api/v1/expenses/{expense_id}/approve",
            "GET /api/v1/expenses/summary"
        ],
        "Approvals": [
            "GET /api/v1/approvals/",
            "POST /api/v1/approvals/",
            "GET /api/v1/approvals/{approval_id}",
            "PUT /api/v1/approvals/{approval_id}",
            "POST /api/v1/approvals/{approval_id}/approve",
            "POST /api/v1/approvals/{approval_id}/reject",
            "POST /api/v1/approvals/{approval_id}/cancel",
            "GET /api/v1/approvals/{approval_id}/comments",
            "POST /api/v1/approvals/{approval_id}/comments"
        ],
        "Reports": [
            "GET /api/v1/reports/",
            "POST /api/v1/reports/",
            "GET /api/v1/reports/{report_id}",
            "PUT /api/v1/reports/{report_id}",
            "DELETE /api/v1/reports/{report_id}",
            "POST /api/v1/reports/{report_id}/download",
            "POST /api/v1/reports/{report_id}/regenerate"
        ],
        "Dashboard": [
            "GET /api/v1/dashboard/overview",
            "GET /api/v1/dashboard/kpi",
            "GET /api/v1/dashboard/recent-activity"
        ],
        "Notifications": [
            "GET /api/v1/notifications/",
            "PUT /api/v1/notifications/{notification_id}",
            "DELETE /api/v1/notifications/{notification_id}",
            "POST /api/v1/notifications/mark-read",
            "POST /api/v1/notifications/broadcast"
        ],
        "Admin": [
            "GET /api/v1/admin/stats",
            "GET /api/v1/admin/audit-logs",
            "POST /api/v1/admin/backup",
            "GET /api/v1/admin/backups",
            "POST /api/v1/admin/restore-backup",
            "POST /api/v1/admin/cleanup",
            "POST /api/v1/admin/send-notification",
            "GET /api/v1/admin/health-check",
            "POST /api/v1/admin/export-users",
            "GET /api/v1/admin/system-settings",
            "PUT /api/v1/admin/system-settings"
        ]
    }
    
    for category, endpoint_list in endpoints.items():
        print(f"\n📂 {category}:")
        for endpoint in endpoint_list:
            print(f"   {endpoint}")
    
    print(f"\n📊 Total: {sum(len(v) for v in endpoints.values())} endpoints")

if __name__ == "__main__":
    print("🚀 Finance Management System - Quick API Test")
    print("This will test if the API is running and show the complete structure")
    print()
    
    # Show API structure first
    show_api_structure()
    
    # Test API endpoints
    success = test_api_endpoints()
    
    if success:
        print("\n✨ Next Steps:")
        print("1. Start the server: uvicorn app.main:app --reload")
        print("2. Visit the API docs: http://localhost:8000/docs")
        print("3. Run the full hierarchy test: python test_hierarchy.py")
        print("4. Deploy with Docker: docker-compose up -d")
    else:
        print("\n🔧 Troubleshooting:")
        print("1. Make sure all dependencies are installed: pip install -r requirements.txt")
        print("2. Check the database configuration in .env")
        print("3. Start the server: uvicorn app.main:app --reload")
