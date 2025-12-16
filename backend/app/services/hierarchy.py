from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session # type: ignore[import-untyped]

from ..crud.user import user as user_crud
from ..models.user import User, UserRole


class HierarchyService:
    """Service for managing user hierarchy and permissions"""
    
    @staticmethod
    def get_user_hierarchy(db: Session, user_id: int) -> Dict[str, Any]:
        """Get complete hierarchy information for a user"""
        user = user_crud.get(db, user_id)
        if not user:
            return {}
        
        # Get manager
        manager = None
        if user.manager_id:
            manager = user_crud.get(db, user.manager_id)
        
        # Get direct subordinates
        direct_subordinates = user_crud.get_subordinates(db, user_id)
        
        # Get all subordinates (recursive)
        all_subordinates = user_crud.get_hierarchy(db, user_id)
        
        # Get hierarchy level
        hierarchy_level = HierarchyService._get_hierarchy_level(db, user_id)
        
        return {
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role.value,
                "department": user.department
            },
            "manager": {
                "id": manager.id,
                "username": manager.username,
                "full_name": manager.full_name,
                "role": manager.role.value
            } if manager else None,
            "direct_subordinates": [
                {
                    "id": sub.id,
                    "username": sub.username,
                    "full_name": sub.full_name,
                    "role": sub.role.value,
                    "department": sub.department
                }
                for sub in direct_subordinates
            ],
            "all_subordinates_count": len(all_subordinates),
            "hierarchy_level": hierarchy_level,
            "can_manage": len(direct_subordinates) > 0
        }
    
    @staticmethod
    def _get_hierarchy_level(db: Session, user_id: int) -> int:
        """Calculate the hierarchy level of a user (0 = top level)"""
        level = 0
        current_user = user_crud.get(db, user_id)
        
        while current_user and current_user.manager_id:
            level += 1
            current_user = user_crud.get(db, current_user.manager_id)
        
        return level
    
    @staticmethod
    def can_manage_user(db: Session, manager_id: int, subordinate_id: int) -> bool:
        """Check if a user can manage another user"""
        if manager_id == subordinate_id:
            return True  # Users can manage themselves
        
        manager = user_crud.get(db, manager_id)
        subordinate = user_crud.get(db, subordinate_id)
        
        if not manager or not subordinate:
            return False
        
        # Admins and super admins can manage everyone
        if manager.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return True
        
        # Check if subordinate is in manager's hierarchy
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, manager_id)]
        return subordinate_id in subordinate_ids
    
    @staticmethod
    def get_accessible_user_ids(db: Session, user_id: int) -> List[int]:
        """Get list of user IDs that the current user can access"""
        user = user_crud.get(db, user_id)
        if not user:
            return []
        
        # Admins and super admins can access all users
        if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            all_users = user_crud.get_multi(db, skip=0, limit=10000)
            return [u.id for u in all_users]
        
        # Managers can access themselves and their subordinates
        if user.role == UserRole.MANAGER:
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, user_id)]
            return [user_id] + subordinate_ids
        
        # Regular users can only access themselves
        return [user_id]
    
    @staticmethod
    def get_department_hierarchy(db: Session, department: str) -> Dict[str, Any]:
        """Get hierarchy information for a department"""
        department_users = db.query(User).filter(
            User.department == department,
            User.is_active == True
        ).all()
        
        if not department_users:
            return {"department": department, "users": [], "hierarchy": []}
        
        # Group by role
        role_groups = {}
        for user in department_users:
            role = user.role.value
            if role not in role_groups:
                role_groups[role] = []
            role_groups[role].append({
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "manager_id": user.manager_id
            })
        
        # Build hierarchy tree
        hierarchy = HierarchyService._build_hierarchy_tree(department_users)
        
        return {
            "department": department,
            "total_users": len(department_users),
            "by_role": role_groups,
            "hierarchy": hierarchy
        }
    
    @staticmethod
    def _build_hierarchy_tree(users: List[User]) -> List[Dict[str, Any]]:
        """Build a hierarchical tree structure from users"""
        # Create user lookup
        user_lookup = {user.id: user for user in users}
        
        # Find top-level users (no manager in the same department)
        top_level = []
        for user in users:
            if user.manager_id is None or user.manager_id not in user_lookup:
                top_level.append(user)
        
        # Build tree recursively
        tree = []
        for user in top_level:
            tree.append(HierarchyService._build_user_node(user, user_lookup))
        
        return tree
    
    @staticmethod
    def _build_user_node(user: User, user_lookup: Dict[int, User]) -> Dict[str, Any]:
        """Build a node in the hierarchy tree"""
        node = {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.value,
            "department": user.department,
            "subordinates": []
        }
        
        # Find direct subordinates
        for other_user in user_lookup.values():
            if other_user.manager_id == user.id:
                node["subordinates"].append(HierarchyService._build_user_node(other_user, user_lookup))
        
        return node
    
    @staticmethod
    def validate_hierarchy_change(db: Session, user_id: int, new_manager_id: Optional[int]) -> bool:
        """Validate if a hierarchy change is allowed"""
        user = user_crud.get(db, user_id)
        if not user:
            return False
        
        # Cannot assign yourself as your own manager
        if new_manager_id == user_id:
            return False
        
        # If no manager specified, it's valid
        if new_manager_id is None:
            return True
        
        new_manager = user_crud.get(db, new_manager_id)
        if not new_manager:
            return False
        
        # Cannot create circular hierarchy
        if HierarchyService._would_create_cycle(db, user_id, new_manager_id):
            return False
        
        # Manager must have sufficient role
        manager_roles = [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN]
        if new_manager.role not in manager_roles:
            return False
        
        return True
    
    @staticmethod
    def _would_create_cycle(db: Session, user_id: int, manager_id: int) -> bool:
        """Check if assigning manager_id to user_id would create a cycle"""
        # Check if user_id is already an ancestor of manager_id
        current = user_crud.get(db, manager_id)
        visited = set()
        
        while current and current.id not in visited:
            if current.id == user_id:
                return True  # Cycle detected
            
            visited.add(current.id)
            if current.manager_id:
                current = user_crud.get(db, current.manager_id)
            else:
                break
        
        return False
    
    @staticmethod
    def get_management_chain(db: Session, user_id: int) -> List[Dict[str, Any]]:
        """Get the management chain up to the top"""
        chain = []
        current = user_crud.get(db, user_id)
        
        while current:
            chain.append({
                "id": current.id,
                "username": current.username,
                "full_name": current.full_name,
                "role": current.role.value,
                "department": current.department
            })
            
            if current.manager_id:
                current = user_crud.get(db, current.manager_id)
            else:
                break
        
        return chain
    
    @staticmethod
    def get_role_permissions() -> Dict[str, Dict[str, Any]]:
        """Get permissions for each role based on hierarchy requirements"""
        return {
            UserRole.EMPLOYEE.value: {
                "can_create_entries": True,
                "can_view_own_entries": True,
                "can_edit_own_entries": True,
                "can_delete_own_entries": True,
                "can_view_reports": True,
                "can_create_reports": True,
                "can_manage_users": False,
                "can_approve_entries": False,
                "can_view_all_entries": False,
                "can_view_team_entries": False,
                "can_access_admin": False,
                "can_create_subordinates": False
            },
            UserRole.ACCOUNTANT.value: {
                "can_create_entries": True,
                "can_view_own_entries": True,
                "can_edit_own_entries": True,
                "can_delete_own_entries": True,
                "can_view_reports": True,
                "can_create_reports": True,
                "can_manage_users": False,
                "can_approve_entries": False,
                "can_view_all_entries": False,
                "can_view_team_entries": False,
                "can_access_admin": False,
                "can_create_subordinates": False
            },
            UserRole.MANAGER.value: {
                "can_create_entries": True,
                "can_view_own_entries": True,
                "can_edit_own_entries": True,
                "can_delete_own_entries": True,
                "can_view_reports": True,
                "can_create_reports": True,
                "can_manage_users": True,  # Can create accountants and employees
                "can_approve_entries": True,
                "can_view_all_entries": False,
                "can_view_team_entries": True,  # Can view subordinate entries
                "can_access_admin": False,
                "can_create_subordinates": True,  # Can create accountants and employees
                "can_delegate_actions": True  # Can perform or delegate subordinate actions
            },
            UserRole.ADMIN.value: {
                "can_create_entries": True,
                "can_view_own_entries": True,
                "can_edit_own_entries": True,
                "can_delete_own_entries": True,
                "can_view_reports": True,
                "can_create_reports": True,
                "can_manage_users": True,  # Can create and manage managers
                "can_approve_entries": True,
                "can_view_all_entries": True,  # Can view everything
                "can_view_team_entries": True,
                "can_access_admin": True,
                "can_create_subordinates": True,  # Can create managers
                "can_delegate_actions": True,
                "can_override_subordinates": True  # Can override any subordinate actions
            },
            UserRole.SUPER_ADMIN.value: {
                "can_create_entries": True,
                "can_view_own_entries": True,
                "can_edit_own_entries": True,
                "can_delete_own_entries": True,
                "can_view_reports": True,
                "can_create_reports": True,
                "can_manage_users": True,  # Full user management
                "can_approve_entries": True,
                "can_view_all_entries": True,
                "can_view_team_entries": True,
                "can_access_admin": True,
                "can_create_subordinates": True,  # Can create admins
                "can_delegate_actions": True,
                "can_override_subordinates": True,
                "can_manage_system": True
            }
        }
    
    @staticmethod
    def can_delegate_action(delegator_role: UserRole, subordinate_role: UserRole, action: str) -> bool:
        """Check if a delegator can perform or delegate a subordinate's action"""
        permissions = HierarchyService.get_role_permissions()
        
        # Get delegator permissions
        delegator_perms = permissions.get(delegator_role.value, {})
        
        # Check if delegator has permission to view/manage subordinates
        if not delegator_perms.get("can_view_team_entries", False):
            return False
        
        # Check specific action delegation rules
        if action in ["create_entries", "view_entries", "edit_entries"]:
            return delegator_role in [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN]
        elif action in ["approve_entries", "manage_users"]:
            return delegator_role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        elif action == "manage_system":
            return delegator_role == UserRole.SUPER_ADMIN
        
        return delegator_perms.get("can_delegate_actions", False)
    
    @staticmethod
    def can_override_action(user_role: UserRole, target_role: UserRole) -> bool:
        """Check if user can override actions of target role"""
        role_hierarchy = {
            UserRole.EMPLOYEE: 0,
            UserRole.ACCOUNTANT: 1,
            UserRole.MANAGER: 2,
            UserRole.ADMIN: 3,
            UserRole.SUPER_ADMIN: 4,
        }
        
        user_level = role_hierarchy.get(user_role, 0)
        target_level = role_hierarchy.get(target_role, 0)
        
        # Only admin and super admin can override
        if user_role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return False
        
        # Can override lower level roles
        return user_level > target_level
    
    @staticmethod
    def check_permission(user_role: UserRole, permission: str) -> bool:
        """Check if a role has a specific permission"""
        permissions = HierarchyService.get_role_permissions()
        role_permissions = permissions.get(user_role.value, {})
        return role_permissions.get(permission, False)
