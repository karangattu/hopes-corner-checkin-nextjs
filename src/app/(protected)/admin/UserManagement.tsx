'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { UserRole } from '@/lib/supabase/roles';
import { updateUserRoleAction, deleteUserAction, getAllUsersAction } from './actions';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Record<string, UserRole>>({});

  const roles: UserRole[] = ['admin', 'board', 'staff', 'checkin'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsersAction();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data) {
        setUsers(result.data);
        // Initialize selected roles with current roles
        const roleMap: Record<string, UserRole> = {};
        result.data.forEach((user: User) => {
          roleMap[user.id] = user.role;
        });
        setSelectedRole(roleMap);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string) => {
    const newRole = selectedRole[userId];
    try {
      const result = await updateUserRoleAction(userId, newRole);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) {
      return;
    }
    try {
      const result = await deleteUserAction(userId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setUsers(users.filter((u) => u.id !== userId));
      toast.success('User deleted');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={fetchUsers} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {users.length === 0 ? (
        <p className="text-gray-500">Click "Refresh" to load users</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <select
                      value={selectedRole[user.id] || user.role}
                      onChange={(e) =>
                        setSelectedRole({
                          ...selectedRole,
                          [user.id]: e.target.value as UserRole,
                        })
                      }
                      className="border rounded px-2 py-1"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleRoleChange(user.id)}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
