'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { PosFrontendService } from '../../lib/posService';
import ScannerModal from '../../components/ScannerModal';
import { apiFetch } from '../../lib/api';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCategories: number;
  lowStockProducts: number;
  pendingPurchases: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCategories: 0,
    lowStockProducts: 0,
    pendingPurchases: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch real stats from API
    // For now, using mock data
    setStats({
      totalOrders: 201,
      totalRevenue: 1570,
      totalProducts: 1250,
      totalCategories: 25,
      lowStockProducts: 8,
      pendingPurchases: 3,
    });
    setLoading(false);
  }, []);

  const handleNewOrder = async () => {
    const mockOrder = {
      outletId: 'clw123...', // These should be real IDs in a real app
      items: [
        { productId: 'clp456...', quantity: 2, discount: 0 }
      ],
      notes: 'Test order'
    };
    
    try {
      const result = await PosFrontendService.createOrder(mockOrder);
      if (result.mode === 'online') {
        alert(`Order ${result.data.orderNo} created successfully via API!`);
      } else {
        alert('Saved locally due to offline/server issue. Will sync later.');
      }
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Order failed to save even locally.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="card">
          <h1>Loading Dashboard...</h1>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="small">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card success">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
            <span className="stat-change positive">+25% from last month</span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <div className="stat-subtext">Unique Products</div>
            <span className="stat-change positive">+17% from last month</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>${stats.totalRevenue}</h3>
            <p>Total Revenue</p>
            <span className="stat-change positive">+22% from last month</span>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalCategories}</h3>
            <p>Categories</p>
            <span className="stat-change neutral">No change</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Sales Chart Placeholder */}
        <div className="chart-card">
          <div className="card-header">
            <h3>Sales Analytics</h3>
            <p className="small">Your shop sales performance</p>
          </div>
          <div className="chart-placeholder">
            <div className="chart-metrics">
              <div className="metric">
                <span className="metric-label">Weekly Income</span>
                <span className="metric-value">$850</span>
                <span className="metric-change positive">+25%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Weekly Sales</span>
                <span className="metric-value">240</span>
                <span className="metric-change negative">-12%</span>
              </div>
            </div>
            <div className="chart-area">
              📊 Chart will be implemented here
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="actions-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="action-buttons">
            <button className="action-btn primary" onClick={handleNewOrder}>
              <span className="action-icon">➕</span>
              New Order
            </button>
            <button className="action-btn secondary">
              <span className="action-icon">📦</span>
              Add Product
            </button>
            <button className="action-btn secondary">
              <span className="action-icon">🛒</span>
              New Purchase
            </button>
            <button className="action-btn secondary">
              <span className="action-icon">📊</span>
              View Reports
            </button>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="alert-card">
          <div className="card-header">
            <h3>⚠️ Low Stock Alert</h3>
            <p className="small">Products that need restocking</p>
          </div>
          <div className="alert-list">
            {stats.lowStockProducts > 0 ? (
              <div className="alert-item">
                <span className="alert-badge">{stats.lowStockProducts}</span>
                <span>products are below reorder level</span>
                <button className="alert-action">View Details</button>
              </div>
            ) : (
              <p className="no-alerts">All products are well stocked! 🎉</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">🛒</div>
              <div className="activity-content">
                <p>New order #ORD-2024-001 created</p>
                <span className="activity-time">2 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📦</div>
              <div className="activity-content">
                <p>Product "Wireless Mouse" added to inventory</p>
                <span className="activity-time">15 minutes ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">💰</div>
              <div className="activity-content">
                <p>Purchase order #PUR-2024-005 received</p>
                <span className="activity-time">1 hour ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
