'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Tenant {
  id: string;
  code: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

interface SettingsRequest {
  id: string;
  tenantId: string;
  tenant: { name: string; code: string };
  requestType: string;
  details: any;
  status: string;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'settings'>('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [settingsRequests, setSettingsRequests] = useState<SettingsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    if (activeTab === 'tenants') {
      fetchTenants();
    } else {
      fetchSettingsRequests();
    }
  }, [activeTab]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/super-admin/login');
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (!userData.isSuperAdmin) {
        router.push('/');
        return;
      }
    } catch {
      router.push('/super-admin/login');
      return;
    }
  };

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenants/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTenants(data.data || []);
      } else {
        setError('Failed to fetch tenants');
      }
    } catch (err) {
      setError('Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettingsRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings-requests?status=PENDING', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettingsRequests(data.data || []);
      } else {
        setError('Failed to fetch settings requests');
      }
    } catch (err) {
      setError('Failed to fetch settings requests');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantAction = async (tenantId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants/${tenantId}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        // Refresh the list
        fetchTenants();
      } else {
        setError(`Failed to ${action} tenant`);
      }
    } catch (err) {
      setError(`Failed to ${action} tenant`);
    }
  };

  const handleSettingsAction = async (requestId: string, action: 'APPROVED' | 'REJECTED', notes?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/settings-requests/${requestId}/review`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action, notes }),
      });

      if (response.ok) {
        // Refresh the list
        fetchSettingsRequests();
      } else {
        setError(`Failed to ${action.toLowerCase()} settings request`);
      }
    } catch (err) {
      setError(`Failed to ${action.toLowerCase()} settings request`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-indigo-600 hover:text-indigo-500 text-sm"
              >
                ← Back to Home
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tenants'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Tenants ({tenants.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings Requests ({settingsRequests.length})
            </button>
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tenants Tab */}
        {activeTab === 'tenants' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {tenants.length === 0 ? (
                <li className="px-6 py-8 text-center text-gray-500">
                  No pending tenant registrations
                </li>
              ) : (
                tenants.map((tenant) => (
                  <li key={tenant.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {tenant.name} ({tenant.code})
                            </p>
                            <p className="text-sm text-gray-500">{tenant.email}</p>
                            <p className="text-xs text-gray-400">
                              Registered: {new Date(tenant.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleTenantAction(tenant.id, 'approve')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleTenantAction(tenant.id, 'reject')}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {/* Settings Requests Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {settingsRequests.length === 0 ? (
                <li className="px-6 py-8 text-center text-gray-500">
                  No pending settings requests
                </li>
              ) : (
                settingsRequests.map((request) => (
                  <li key={request.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {request.tenant.name} ({request.tenant.code})
                          </p>
                          <p className="text-sm text-gray-500">
                            {request.requestType}: {JSON.stringify(request.details)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Requested: {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSettingsAction(request.id, 'APPROVED')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleSettingsAction(request.id, 'REJECTED')}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}