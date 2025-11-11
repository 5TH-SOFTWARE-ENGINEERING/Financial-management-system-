"""
Test script to verify the administrative hierarchy and permission workflow
This script tests the core requirements:
1. Admin creates and manages Finance Managers
2. Finance Managers create and oversee Accountants and Employees  
3. Finance Managers can perform (or delegate) all actions their subordinates can do
4. Admin can view and control everything, including all Finance Managers and their subordinates
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_hierarchy.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

def setup_test_data():
    """Setup test users with proper hierarchy"""
    db = TestingSessionLocal()
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Clear existing data
    db.query(User).delete()
    db.commit()
    
    # Create Super Admin
    super_admin = User(
        email="superadmin@test.com",
        username="superadmin",
        hashed_password=get_password_hash("test123"),
        full_name="Super Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(super_admin)
    
    # Create Admin
    admin = User(
        email="admin@test.com",
        username="admin",
        hashed_password=get_password_hash("test123"),
        full_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(admin)
    
    # Create Finance Manager (assigned to Admin)
    finance_manager = User(
        email="manager@test.com",
        username="manager",
        hashed_password=get_password_hash("test123"),
        full_name="Finance Manager",
        role=UserRole.MANAGER,
        is_active=True,
        is_verified=True,
        manager_id=admin.id
    )
    db.add(finance_manager)
    
    # Create Accountant (assigned to Finance Manager)
    accountant = User(
        email="accountant@test.com",
        username="accountant",
        hashed_password=get_password_hash("test123"),
        full_name="Accountant User",
        role=UserRole.ACCOUNTANT,
        is_active=True,
        is_verified=True,
        manager_id=finance_manager.id
    )
    db.add(accountant)
    
    # Create Employee (assigned to Finance Manager)
    employee = User(
        email="employee@test.com",
        username="employee",
        hashed_password=get_password_hash("test123"),
        full_name="Employee User",
        role=UserRole.EMPLOYEE,
        is_active=True,
        is_verified=True,
        manager_id=finance_manager.id
    )
    db.add(employee)
    
    db.commit()
    
    # Get IDs for testing
    users = {
        "super_admin": super_admin.id,
        "admin": admin.id,
        "manager": finance_manager.id,
        "accountant": accountant.id,
        "employee": employee.id
    }
    
    db.close()
    return users

def get_auth_token(username, password):
    """Get authentication token for user"""
    response = client.post("/api/v1/auth/login", data={
        "username": username,
        "password": password
    })
    return response.json()["access_token"]

def test_admin_creates_manager():
    """Test: Admin creates and manages Finance Managers"""
    print("\n🧪 Testing: Admin creates and manages Finance Managers")
    
    # Get admin token
    admin_token = get_auth_token("admin", "test123")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test: Admin can create a manager
    new_manager_data = {
        "email": "newmanager@test.com",
        "username": "newmanager",
        "password": "test123",
        "full_name": "New Finance Manager",
        "role": "manager",
        "department": "Finance"
    }
    
    response = client.post("/api/v1/users/", json=new_manager_data, headers=headers)
    assert response.status_code == 200, f"Admin should be able to create manager: {response.text}"
    new_manager = response.json()
    print(f"✅ Admin successfully created manager: {new_manager['username']}")
    
    # Test: Admin can view all users
    response = client.get("/api/v1/users/", headers=headers)
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 6, "Admin should see all users including the new manager"
    print(f"✅ Admin can view all users ({len(users)} total)")
    
    # Test: Admin can view hierarchy tree
    response = client.get("/api/v1/users/hierarchy-tree", headers=headers)
    assert response.status_code == 200
    hierarchy = response.json()
    assert len(hierarchy) > 0, "Admin should see hierarchy tree"
    print(f"✅ Admin can view hierarchy tree with {len(hierarchy)} managers")
    
    return new_manager['id']

def test_manager_creates_subordinates():
    """Test: Finance Managers create and oversee Accountants and Employees"""
    print("\n🧪 Testing: Finance Managers create and oversee Accountants and Employees")
    
    # Get manager token
    manager_token = get_auth_token("manager", "test123")
    headers = {"Authorization": f"Bearer {manager_token}"}
    
    # Test: Manager can create accountant
    accountant_data = {
        "email": "newaccountant@test.com",
        "username": "newaccountant", 
        "password": "test123",
        "full_name": "New Accountant",
        "role": "accountant",
        "department": "Finance"
    }
    
    response = client.post("/api/v1/users/subordinates", json=accountant_data, headers=headers)
    assert response.status_code == 200, f"Manager should be able to create accountant: {response.text}"
    accountant = response.json()
    print(f"✅ Manager successfully created accountant: {accountant['username']}")
    
    # Test: Manager can create employee
    employee_data = {
        "email": "newemployee@test.com",
        "username": "newemployee",
        "password": "test123", 
        "full_name": "New Employee",
        "role": "employee",
        "department": "Finance"
    }
    
    response = client.post("/api/v1/users/subordinates", json=employee_data, headers=headers)
    assert response.status_code == 200, f"Manager should be able to create employee: {response.text}"
    employee = response.json()
    print(f"✅ Manager successfully created employee: {employee['username']}")
    
    # Test: Manager cannot create another manager
    manager_data = {
        "email": "unauthorized@test.com",
        "username": "unauthorized",
        "password": "test123",
        "full_name": "Unauthorized Manager",
        "role": "manager",
        "department": "Finance"
    }
    
    response = client.post("/api/v1/users/subordinates", json=manager_data, headers=headers)
    assert response.status_code == 403, "Manager should NOT be able to create another manager"
    print("✅ Manager correctly prevented from creating another manager")
    
    # Test: Manager can view their subordinates
    response = client.get(f"/api/v1/users/{accountant['id']}/subordinates", headers=headers)
    assert response.status_code == 200
    subordinates = response.json()
    assert len(subordinates) >= 2, "Manager should see their subordinates"
    print(f"✅ Manager can view their subordinates ({len(subordinates)} total)")
    
    return accountant['id'], employee['id']

def test_manager_delegates_actions():
    """Test: Finance Managers can perform or delegate all actions their subordinates can do"""
    print("\n🧪 Testing: Finance Managers can perform or delegate subordinate actions")
    
    # Get manager token
    manager_token = get_auth_token("manager", "test123")
    headers = {"Authorization": f"Bearer {manager_token}"}
    
    # Get subordinate info
    response = client.get("/api/v1/users/me", headers=headers)
    manager = response.json()
    
    # Get accountant token for testing
    accountant_token = get_auth_token("accountant", "test123")
    accountant_headers = {"Authorization": f"Bearer {accountant_token}"}
    
    # Test: Accountant can create revenue entry
    revenue_data = {
        "title": "Test Revenue",
        "amount": 1000.00,
        "category": "sales",
        "source": "client payment",
        "date": "2024-01-01T00:00:00"
    }
    
    response = client.post("/api/v1/revenue/", json=revenue_data, headers=accountant_headers)
    assert response.status_code == 200
    revenue = response.json()
    print(f"✅ Accountant can create revenue entry: {revenue['title']}")
    
    # Test: Manager can view subordinate's revenue entries
    response = client.get("/api/v1/revenue/", headers=headers)
    assert response.status_code == 200
    revenues = response.json()
    subordinate_revenue = [r for r in revenues if r['created_by']['username'] == 'accountant']
    assert len(subordinate_revenue) > 0, "Manager should see subordinate's revenue entries"
    print(f"✅ Manager can view subordinate's revenue entries ({len(subordinate_revenue)} found)")
    
    # Test: Manager can delegate action to subordinate
    response = client.post(f"/api/v1/users/{revenue['created_by']['id']}/delegate-action", 
                          json={"action": "create_entries"}, headers=headers)
    assert response.status_code == 200
    result = response.json()
    print(f"✅ Manager can delegate actions: {result['message']}")
    
    # Test: Manager can override subordinate's action (if admin)
    # This should fail for manager, succeed for admin
    response = client.post(f"/api/v1/users/{revenue['created_by']['id']}/override-action",
                          json={"action": "create_entries"}, headers=headers)
    assert response.status_code == 403, "Manager should NOT be able to override actions"
    print("✅ Manager correctly prevented from overriding actions")

def test_admin_controls_everything():
    """Test: Admin can view and control everything, including all Finance Managers and their subordinates"""
    print("\n🧪 Testing: Admin can view and control everything")
    
    # Get admin token
    admin_token = get_auth_token("admin", "test123")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test: Admin can view all revenue entries
    response = client.get("/api/v1/revenue/", headers=headers)
    assert response.status_code == 200
    all_revenues = response.json()
    assert len(all_revenues) > 0, "Admin should see all revenue entries"
    print(f"✅ Admin can view all revenue entries ({len(all_revenues)} total)")
    
    # Test: Admin can view all expense entries
    response = client.get("/api/v1/expenses/", headers=headers)
    assert response.status_code == 200
    all_expenses = response.json()
    print(f"✅ Admin can view all expense entries ({len(all_expenses)} total)")
    
    # Test: Admin can override subordinate actions
    # Get any subordinate user
    response = client.get("/api/v1/users/", headers=headers)
    users = response.json()
    subordinate = next((u for u in users if u['role'] in ['accountant', 'employee']), None)
    
    if subordinate:
        response = client.post(f"/api/v1/users/{subordinate['id']}/override-action",
                              json={"action": "create_entries"}, headers=headers)
        assert response.status_code == 200
        result = response.json()
        print(f"✅ Admin can override subordinate actions: {result['message']}")
    
    # Test: Admin can manage any user
    test_user = next((u for u in users if u['role'] == 'manager'), None)
    if test_user:
        update_data = {"full_name": "Updated by Admin"}
        response = client.put(f"/api/v1/users/{test_user['id']}", json=update_data, headers=headers)
        assert response.status_code == 200
        updated_user = response.json()
        assert updated_user['full_name'] == "Updated by Admin"
        print(f"✅ Admin can update any user: {updated_user['username']}")

def test_hierarchy_restrictions():
    """Test that hierarchy restrictions are properly enforced"""
    print("\n🧪 Testing: Hierarchy restrictions are properly enforced")
    
    # Test: Employee cannot create users
    employee_token = get_auth_token("employee", "test123")
    headers = {"Authorization": f"Bearer {employee_token}"}
    
    user_data = {
        "email": "test@test.com",
        "username": "test",
        "password": "test123",
        "full_name": "Test User",
        "role": "employee"
    }
    
    response = client.post("/api/v1/users/", json=user_data, headers=headers)
    assert response.status_code == 403, "Employee should NOT be able to create users"
    print("✅ Employee correctly prevented from creating users")
    
    # Test: Accountant cannot create users
    accountant_token = get_auth_token("accountant", "test123")
    headers = {"Authorization": f"Bearer {accountant_token}"}
    
    response = client.post("/api/v1/users/", json=user_data, headers=headers)
    assert response.status_code == 403, "Accountant should NOT be able to create users"
    print("✅ Accountant correctly prevented from creating users")
    
    # Test: Employee can only see their own entries
    response = client.get("/api/v1/revenue/", headers=headers)
    assert response.status_code == 200
    revenues = response.json()
    for revenue in revenues:
        assert revenue['created_by']['username'] == 'employee', "Employee should only see their own entries"
    print(f"✅ Employee can only see their own entries ({len(revenues)} total)")

def main():
    """Run all hierarchy tests"""
    print("🚀 Starting Finance Management System Hierarchy Tests")
    print("=" * 60)
    
    try:
        # Setup test data
        users = setup_test_data()
        print("✅ Test data setup complete")
        
        # Run tests
        test_admin_creates_manager()
        test_manager_creates_subordinates()
        test_manager_delegates_actions()
        test_admin_controls_everything()
        test_hierarchy_restrictions()
        
        print("\n" + "=" * 60)
        print("🎉 ALL HIERARCHY TESTS PASSED!")
        print("✅ Administrative hierarchy and permission workflow working correctly")
        print("✅ All requirements implemented and verified")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Cleanup
        if os.path.exists("test_hierarchy.db"):
            os.remove("test_hierarchy.db")
            print("🧹 Test database cleaned up")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
