<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { db } from '$lib/config/firebase';
  import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  onMount(() => {
    if ($currentUser && $currentUser.role !== 'admin') {
      goto('/dashboard');
    } else if ($currentUser?.role === 'admin') {
      loadActivityLogs();
    }
  });

  let loading = true;
  let activityLogs: any[] = [];
  let filteredLogs: any[] = [];
  let errorMessage = '';

  // Filters
  let searchTerm = '';
  let actionFilter = 'all';
  let userRoleFilter = 'all';
  let dateFilter = 'all';

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'view', label: 'View' },
    { value: 'export', label: 'Export' },
    { value: 'approve', label: 'Approve' },
    { value: 'reject', label: 'Reject' }
  ];

  const roleTypes = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'broker', label: 'Broker' },
    { value: 'assistant', label: 'Assistant' },
    { value: 'customer', label: 'Customer' }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  async function loadActivityLogs() {
    loading = true;
    try {
      // For demo purposes, create some mock activity logs
      // In a real app, you'd query from a proper activity_logs collection
      const mockLogs = [
        {
          id: '1',
          userId: 'user123',
          userName: 'John Smith',
          userRole: 'broker',
          action: 'create',
          resource: 'quote',
          resourceId: 'QUO-123',
          details: 'Created new quote for ABC Corp',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...'
        },
        {
          id: '2',
          userId: 'user456',
          userName: 'Sarah Johnson',
          userRole: 'admin',
          action: 'update',
          resource: 'user',
          resourceId: 'user789',
          details: 'Updated user role from broker to admin',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0...'
        },
        {
          id: '3',
          userId: 'user789',
          userName: 'Mike Wilson',
          userRole: 'customer',
          action: 'login',
          resource: 'auth',
          resourceId: null,
          details: 'User logged in',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0...'
        },
        {
          id: '4',
          userId: 'user123',
          userName: 'John Smith',
          userRole: 'broker',
          action: 'delete',
          resource: 'client',
          resourceId: 'client456',
          details: 'Deleted client: XYZ Company',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...'
        },
        {
          id: '5',
          userId: 'user456',
          userName: 'Sarah Johnson',
          userRole: 'admin',
          action: 'export',
          resource: 'report',
          resourceId: 'monthly-report',
          details: 'Exported monthly activity report',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0...'
        }
      ];

      activityLogs = mockLogs;
      applyFilters();
    } catch (error) {
      console.error('Error loading activity logs:', error);
      errorMessage = 'Failed to load activity logs';
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    filteredLogs = activityLogs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesRole = userRoleFilter === 'all' || log.userRole === userRoleFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const now = new Date();
        const logDate = new Date(log.timestamp);
        
        switch (dateFilter) {
          case 'today':
            matchesDate = logDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = logDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = logDate >= monthAgo;
            break;
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            matchesDate = logDate >= quarterAgo;
            break;
        }
      }
      
      return matchesSearch && matchesAction && matchesRole && matchesDate;
    });
  }

  // Apply filters when search or filter values change
  $: {
    if (activityLogs.length > 0) {
      applyFilters();
    }
  }

  function getActionColor(action: string) {
    const colors = {
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-gray-100 text-gray-800',
      'create': 'bg-blue-100 text-blue-800',
      'update': 'bg-yellow-100 text-yellow-800',
      'delete': 'bg-red-100 text-red-800',
      'view': 'bg-purple-100 text-purple-800',
      'export': 'bg-indigo-100 text-indigo-800',
      'approve': 'bg-green-100 text-green-800',
      'reject': 'bg-red-100 text-red-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  }

  function getRoleColor(role: string) {
    const colors = {
      'admin': 'bg-red-100 text-red-800',
      'broker': 'bg-blue-100 text-blue-800',
      'assistant': 'bg-green-100 text-green-800',
      'customer': 'bg-neutral-100 text-neutral-800'
    };
    return colors[role] || 'bg-neutral-100 text-neutral-800';
  }

  function formatDate(date: Date) {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getTimeAgo(date: Date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  }
</script>

<svelte:head>
  <title>User Activity - Admin Settings</title>
</svelte:head>

{#if $currentUser?.role === 'admin'}
  <div class="min-h-screen bg-neutral-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="px-4 sm:px-6 lg:max-w-7xl lg:mx-auto lg:px-8">
        <div class="py-6">
          <div class="lg:flex lg:items-center lg:justify-between">
            <div class="flex-1 min-w-0">
              <nav class="flex" aria-label="Breadcrumb">
                <ol role="list" class="flex items-center space-x-4">
                  <li>
                    <a href="/settings/admin" class="text-neutral-400 hover:text-neutral-500">
                      Admin Settings
                    </a>
                  </li>
                  <li>
                    <div class="flex items-center">
                      <svg class="flex-shrink-0 h-5 w-5 text-neutral-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span class="ml-4 text-sm font-medium text-neutral-500">User Activity</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
                User Activity Logs
              </h1>
              <div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div class="mt-2 flex items-center text-sm text-neutral-500">
                  <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Monitor all user actions and system activity
                </div>
              </div>
            </div>
            <div class="mt-5 flex lg:mt-0 lg:ml-4">
              <button
                type="button"
                on:click={loadActivityLogs}
                class="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50"
              >
                <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {#if loading}
          <div class="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        {:else}
          {#if errorMessage}
            <div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p class="text-sm text-red-700">{errorMessage}</p>
            </div>
          {/if}

          <!-- Filters -->
          <div class="bg-white shadow rounded-lg mb-6">
            <div class="px-6 py-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-5">
                <div>
                  <label for="search" class="block text-sm font-medium text-neutral-700">
                    Search
                  </label>
                  <input
                    type="text"
                    id="search"
                    bind:value={searchTerm}
                    placeholder="User, action, or details..."
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label for="actionFilter" class="block text-sm font-medium text-neutral-700">
                    Action
                  </label>
                  <select
                    id="actionFilter"
                    bind:value={actionFilter}
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    {#each actionTypes as action}
                      <option value={action.value}>{action.label}</option>
                    {/each}
                  </select>
                </div>

                <div>
                  <label for="userRoleFilter" class="block text-sm font-medium text-neutral-700">
                    User Role
                  </label>
                  <select
                    id="userRoleFilter"
                    bind:value={userRoleFilter}
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    {#each roleTypes as role}
                      <option value={role.value}>{role.label}</option>
                    {/each}
                  </select>
                </div>

                <div>
                  <label for="dateFilter" class="block text-sm font-medium text-neutral-700">
                    Time Range
                  </label>
                  <select
                    id="dateFilter"
                    bind:value={dateFilter}
                    class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    {#each dateRanges as range}
                      <option value={range.value}>{range.label}</option>
                    {/each}
                  </select>
                </div>

                <div class="flex items-end">
                  <span class="text-sm text-neutral-500">
                    {filteredLogs.length} of {activityLogs.length} logs
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Activity Logs -->
          <div class="bg-white shadow overflow-hidden sm:rounded-md">
            {#if filteredLogs.length === 0}
              <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-neutral-900">No activity logs found</h3>
                <p class="mt-1 text-sm text-neutral-500">Try adjusting your search or filter criteria.</p>
              </div>
            {:else}
              <ul role="list" class="divide-y divide-neutral-200">
                {#each filteredLogs as log}
                  <li class="px-6 py-4 hover:bg-neutral-50">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center">
                        <div class="flex-shrink-0">
                          <div class="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                            <span class="text-neutral-700 font-medium text-sm">
                              {log.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="flex items-center space-x-2">
                            <p class="text-sm font-medium text-neutral-900">{log.userName}</p>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getRoleColor(log.userRole)}">
                              {log.userRole}
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getActionColor(log.action)}">
                              {log.action}
                            </span>
                          </div>
                          <div class="flex items-center space-x-2 mt-1">
                            <p class="text-sm text-neutral-500">{log.details}</p>
                            {#if log.resourceId}
                              <span class="text-xs text-neutral-400">({log.resourceId})</span>
                            {/if}
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="text-sm text-neutral-900">{getTimeAgo(log.timestamp)}</p>
                        <p class="text-xs text-neutral-500">{formatDate(log.timestamp)}</p>
                      </div>
                    </div>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center bg-neutral-50">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
      <p class="text-neutral-600">You need admin privileges to access this page.</p>
    </div>
  </div>
{/if} 