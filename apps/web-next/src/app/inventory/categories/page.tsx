'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  _count?: {
    products: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/inventory/categories');
      // const data = await response.json();

      // Mock data for now
      setCategories([
        {
          id: '1',
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic devices and accessories',
          createdAt: '2024-01-15T10:00:00Z',
          _count: { products: 25 }
        },
        {
          id: '2',
          name: 'Clothing',
          slug: 'clothing',
          description: 'Apparel and fashion items',
          createdAt: '2024-01-16T14:30:00Z',
          _count: { products: 45 }
        },
        {
          id: '3',
          name: 'Books',
          slug: 'books',
          description: 'Books and publications',
          createdAt: '2024-01-17T09:15:00Z',
          _count: { products: 12 }
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/inventory/categories', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      // Mock success
      const newCategory: Category = {
        id: Date.now().toString(),
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        createdAt: new Date().toISOString(),
        _count: { products: 0 }
      };

      setCategories(prev => [...prev, newCategory]);
      setFormData({ name: '', description: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/inventory/categories/${id}`, { method: 'DELETE' });

      // Mock delete
      setCategories(prev => prev.filter(cat => cat.id !== id));
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Categories">
        <div className="card">
          <h1>Loading Categories...</h1>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Categories">
      <div className="page-header">
        <div className="header-content">
          <h1>Categories</h1>
          <p className="small">Manage your product categories</p>
        </div>
        <button
          className="btn primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Category'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>Add New Category</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Category Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Enter category name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description"
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Create Category
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Products</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>
                    <div className="category-name">
                      <strong>{category.name}</strong>
                      <span className="category-slug">/{category.slug}</span>
                    </div>
                  </td>
                  <td>{category.description || '-'}</td>
                  <td>
                    <span className="badge">
                      {category._count?.products || 0} products
                    </span>
                  </td>
                  <td>{new Date(category.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn small secondary">Edit</button>
                      <button
                        className="btn small danger"
                        onClick={() => handleDelete(category.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No Categories Yet</h3>
              <p>Start by creating your first product category.</p>
              <button className="btn primary" onClick={() => setShowForm(true)}>
                Create First Category
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}