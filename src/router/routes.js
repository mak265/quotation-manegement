const routes = [
  {
    path: '/',
    component: () => import('layouts/IndexLayout.vue'),
    children: [{ path: '', component: () => import('pages/auth/LoginPage.vue') }],
  },
  {
    path: '/dashboard',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('pages/admin/DashboardPage.vue'),
        meta: { isSidebarItem: true, label: 'Dashboard', icon: 'dashboard' },
      },
      {
        path: '/inventory',
        name: 'Inventory',
        component: () => import('pages/admin/InventoryPage.vue'),
        meta: {
          isSidebarItem: true,
          isManagement: true,
          label: 'Inventory',
          icon: 'inventory',
          caption: 'Manage products and stock',
        },
      },
      {
        path: '/ordering',
        name: 'Ordering',
        component: () => import('pages/admin/OrderingPage.vue'),
        meta: {
          isSidebarItem: true,
          isManagement: true,
          label: 'Ordering',
          icon: 'shopping_cart',
          caption: 'Process customer orders',
        },
      },
      {
        path: '/transactions',
        name: 'Transactions',
        component: () => import('pages/admin/TransactionsPage.vue'),
        meta: {
          isSidebarItem: true,
          isManagement: true,
          label: 'Transactions',
          icon: 'receipt_long',
          caption: 'Transaction history',
        },
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('pages/admin/SettingsPage.vue'),
        meta: {
          isSidebarItem: true,
          isManagement: true,
          label: 'Settings',
          icon: 'settings',
          caption: 'System settings',
        },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
