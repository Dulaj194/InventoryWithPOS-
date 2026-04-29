'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  user?: {
    name: string;
    role: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      permission: 'read dashboard'
    },
    {
      label: 'Inventory',
      href: '#',
      icon: '📦',
      permission: 'read inventory',
      children: [
        {
          label: 'Categories',
          href: '/inventory/categories',
          permission: 'read category'
        },
        {
          label: 'Products',
          href: '/inventory/products',
          permission: 'read product'
        },
        {
          label: 'Purchases',
          href: '/inventory/purchases',
          permission: 'read purchase'
        }
      ]
    },
    {
      label: 'Sales',
      href: '#',
      icon: '🛒',
      permission: 'read order',
      children: [
        {
          label: 'POS',
          href: '/pos',
          permission: 'create order'
        },
        {
          label: 'Orders',
          href: '/orders',
          permission: 'read order'
        }
      ]
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: '📈',
      permission: 'read reports'
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: '⚙️',
      permission: 'read settings'
    }
  ];

  const isActive = (href: string) => {
    if (href === '#') return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isParentActive = (item: any) => {
    if (item.children) {
      return item.children.some((child: any) => isActive(child.href));
    }
    return isActive(item.href);
  };

  return (
    <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="user-info">
          <div className="user-avatar">
            👤
          </div>
          {!isCollapsed && (
            <div className="user-details">
              <div className="user-name">{user?.name || 'Admin User'}</div>
              <div className="user-role">{user?.role || 'Administrator'}</div>
            </div>
          )}
        </div>
        <button
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <div className="sidebar-menu">
        {navigationItems.map((item, index) => (
          <div key={index} className="menu-section">
            {item.children ? (
              <div className={`menu-group ${isParentActive(item) ? 'active' : ''}`}>
                <div className="menu-item parent">
                  <span className="menu-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="menu-label">{item.label}</span>
                      <span className="menu-arrow">▼</span>
                    </>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="submenu">
                    {item.children.map((child, childIndex) => (
                      <Link
                        key={childIndex}
                        href={child.href}
                        className={`menu-item child ${isActive(child.href) ? 'active' : ''}`}
                      >
                        <span className="menu-label">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className={`menu-item ${isActive(item.href) ? 'active' : ''}`}
              >
                <span className="menu-icon">{item.icon}</span>
                {!isCollapsed && <span className="menu-label">{item.label}</span>}
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="sidebar-brand">
            <span className="brand-text">myPosSystem</span>
            <span className="brand-version">v1.0.0</span>
          </div>
        )}
      </div>
    </nav>
  );
}