'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

interface Product {
  id: string;
  sku: string;
  name: string;
  salePrice: number;
  costPrice: number;
  quantityOnHand: number;
  reorderLevel: number;
  isActive: boolean;
  category?: {
    name: string;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low-stock' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/inventory/products');
      // const data = await response.json();

      // Mock data
      setProducts([
        {
          id: '1',
          sku: 'ELE-001',
          name: 'Wireless Mouse',
          salePrice: 25.99,
          costPrice: 15.50,
          quantityOnHand: 45,
          reorderLevel: 10,
          isActive: true,
          category: { name: 'Electronics' }
        },
        {
          id: '2',
          sku: 'ELE-002',
          name: 'Bluetooth Keyboard',
          salePrice: 49.99,
          costPrice: 30.00,
          quantityOnHand: 8,
          reorderLevel: 15,
          isActive: true,
          category: { name: 'Electronics' }
        },
        {
          id: '3',
          sku: 'CLOTH-001',
          name: 'Cotton T-Shirt',
          salePrice: 15.99,
          costPrice: 8.50,
          quantityOnHand: 120,
          reorderLevel: 20,
          isActive: true,
          category: { name: 'Clothing' }
        },
        {
          id: '4',
          sku: 'BOOK-001',
          name: 'Programming Guide',
          salePrice: 39.99,
          costPrice: 25.00,
          quantityOnHand: 3,
          reorderLevel: 5,
          isActive: false,
          category: { name: 'Books' }
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === 'all' ||
                         (filter === 'low-stock' && product.quantityOnHand <= product.reorderLevel) ||
                         (filter === 'active' && product.isActive) ||
                         (filter === 'inactive' && !product.isActive);

    return matchesSearch && matchesFilter;
  });

  const getStockStatus = (product: Product) => {
    if (product.quantityOnHand <= product.reorderLevel) {
      return { status: 'low', label: 'Low Stock', color: '#ef4444' };
    }
    if (product.quantityOnHand <= product.reorderLevel * 1.5) {
      return { status: 'warning', label: 'Warning', color: '#f59e0b' };
    }
    return { status: 'good', label: 'Good', color: '#10b981' };
  };

  if (loading) {
    return (
      <DashboardLayout title="Products">
        <div className="card">
          <h1>Loading Products...</h1>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Products">
      <div className="page-header">
        <div className="header-content">
          <h1>Products</h1>
          <p className="small">Manage your inventory items</p>
        </div>
        <button
          className="btn primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card filters-card">
        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({products.length})
            </button>
            <button
              className={`filter-btn ${filter === 'low-stock' ? 'active' : ''}`}
              onClick={() => setFilter('low-stock')}
            >
              Low Stock ({products.filter(p => p.quantityOnHand <= p.reorderLevel).length})
            </button>
            <button
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active ({products.filter(p => p.isActive).length})
            </button>
            <button
              className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
              onClick={() => setFilter('inactive')}
            >
              Inactive ({products.filter(p => !p.isActive).length})
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr key={product.id}>
                    <td>
                      <code className="sku">{product.sku}</code>
                    </td>
                    <td>
                      <div className="product-name">
                        <strong>{product.name}</strong>
                      </div>
                    </td>
                    <td>{product.category?.name || '-'}</td>
                    <td>
                      <div className="stock-info">
                        <span className="quantity">{product.quantityOnHand}</span>
                        <span className="reorder-level">
                          (Reorder: {product.reorderLevel})
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="price-info">
                        <span className="sale-price">${product.salePrice}</span>
                        <span className="cost-price">Cost: ${product.costPrice}</span>
                      </div>
                    </td>
                    <td>
                      <div className="status-badges">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: stockStatus.color }}
                        >
                          {stockStatus.label}
                        </span>
                        <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn small secondary">Edit</button>
                        <button className="btn small danger">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No Products Found</h3>
              <p>
                {searchTerm || filter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Start by adding your first product.'
                }
              </p>
              {!searchTerm && filter === 'all' && (
                <button className="btn primary" onClick={() => setShowForm(true)}>
                  Add First Product
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}