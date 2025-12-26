<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { db } from '$lib/config/firebase';
  import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

  // Redirect non-admins
  onMount(() => {
    if ($currentUser && $currentUser.role !== 'admin') {
      goto('/dashboard');
    } else if ($currentUser?.role === 'admin') {
      loadUsers();
    }
  });

  let users: any[] = [];
  let filteredUsers: any[] = [];
  let loading = true;
  let saving = false;
  let showEditModal = false;
  let editingUser: any = null;
  let errorMessage = '';
  let successMessage = '';

  // Filters
  let searchTerm = '';
  let roleFilter = 'all';
  let statusFilter = 'all';

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'broker', label: 'Broker' },
    { value: 'assistant', label: 'Assistant' },
    { value: 'customer', label: 'Customer' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' }
  ];

  let editForm = {
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    status: 'active',
    phone: '',
    department: '',
    title: '',
    notes: ''
  };

  async function loadUsers() {
    loading = true;
    try {
      // Load users from main users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastLoginAt: doc.data().lastLoginAt?.toDate(),
        source: 'users'
      }));

      console.log('Loaded users:', users.length);
      applyFilters();
    } catch (error) {
      console.error('Error loading users:', error);
      errorMessage = 'Failed to load users';
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    filteredUsers = users.filter(user => {
      const matchesSearch = !searchTerm || 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  // Apply filters when search or filter values change
  $: {
    if (users.length > 0) {
      applyFilters();
    }
  }

  function openEditModal(user: any) {
    editingUser = user;
    editForm = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || '',
      status: user.status || 'active',
      phone: user.phone || '',
      department: user.department || '',
      title: user.title || '',
      notes: user.notes || ''
    };
    showEditModal = true;
    errorMessage = '';
  }

  function closeEditModal() {
    showEditModal = false;
    editingUser = null;
    errorMessage = '';
  }

  async function handleUpdateUser() {
    if (!editForm.firstName || !editForm.lastName || !editForm.email || !editForm.role) {
      errorMessage = 'Please fill in all required fields';
      return;
    }

    saving = true;
    errorMessage = '';

    try {
      const updateData = {
        ...editForm,
        updatedAt: new Date(),
        updatedBy: $currentUser.uid
      };

      await updateDoc(doc(db, 'users', editingUser.id), updateData);
      
      // Update local state
      const userIndex = users.findIndex(u => u.id === editingUser.id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updateData };
        users = [...users]; // Trigger reactivity
      }

      successMessage = 'User updated successfully!';
      closeEditModal();
      
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error updating user:', error);
      errorMessage = 'Failed to update user';
    } finally {
      saving = false;
    }
  }

  async function toggleUserStatus(user: any) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    
    try {
      await updateDoc(doc(db, 'users', user.id), {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: $currentUser.uid
      });

      // Update local state
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex].status = newStatus;
        users = [...users]; // Trigger reactivity
      }

      successMessage = `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`;
      
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error updating user status:', error);
      errorMessage = 'Failed to update user status';
    }
  }

  async function deleteUser(user: any) {
    if (user.id === $currentUser.uid) {
      errorMessage = 'You cannot delete your own account';
      return;
    }

    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.id));
      
      // Remove from local state
      users = users.filter(u => u.id !== user.id);

      successMessage = 'User deleted successfully!';
      
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      errorMessage = 'Failed to delete user';
    }
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

  function getStatusColor(status: string) {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'suspended': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  function formatDate(date: Date) {
    return date?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) || 'Never';
  }
</script>

<svelte:head>
  <title>User Management - App Admin Area</title>
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
                    <a href="/admin" class="text-neutral-400 hover:text-neutral-500">
                      App Admin Area
                    </a>
                  </li>
                  <li>
                    <div class="flex items-center">
                      <svg class="flex-shrink-0 h-5 w-5 text-neutral-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span class="ml-4 text-sm font-medium text-neutral-500">User Management</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h1 class="mt-2 text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
                User Management
              </h1>
              <div class="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div class="mt-2 flex items-center text-sm text-neutral-500">
                  <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Manage customers, brokers, and admin users
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    {#if successMessage}
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div class="bg-green-50 border border-green-200 rounded-md p-4">
          <p class="text-sm text-green-700">{successMessage}</p>
        </div>
      </div>
    {/if}

    {#if errorMessage}
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <p class="text-sm text-red-700">{errorMessage}</p>
        </div>
      </div>
    {/if}

    <!-- Content -->
    <div class="py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {#if loading}
          <div class="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        {:else}
          <!-- Filters -->
          <div class="bg-white shadow rounded-lg mb-6">
            <div class="px-6 py-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label for="search" class="block text-sm font-medium text-neutral-700">Search Users</label>
                  <input type="text" id="search" bind:value={searchTerm} placeholder="Name or email..." class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                  <label for="roleFilter" class="block text-sm font-medium text-neutral-700">Role</label>
                  <select id="roleFilter" bind:value={roleFilter} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    {#each roleOptions as option}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label for="statusFilter" class="block text-sm font-medium text-neutral-700">Status</label>
                  <select id="statusFilter" bind:value={statusFilter} class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    {#each statusOptions as option}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                </div>
                <div class="flex items-end">
                  <button on:click={loadUsers} class="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">Refresh</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Users Table -->
          <div class="bg-white shadow overflow-hidden sm:rounded-md">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg leading-6 font-medium text-neutral-900">
                  Users ({filteredUsers.length} of {users.length})
                </h3>
              </div>

              {#if filteredUsers.length === 0}
                <div class="text-center py-12">
                  <svg class="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 class="mt-2 text-sm font-medium text-neutral-900">No users found</h3>
                  <p class="mt-1 text-sm text-neutral-500">Try adjusting your search or filter criteria.</p>
                </div>
              {:else}
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-neutral-200">
                    <thead class="bg-neutral-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Last Login</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Created</th>
                        <th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-neutral-200">
                      {#each filteredUsers as user}
                        <tr class="hover:bg-neutral-50">
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                              <div class="flex-shrink-0 h-10 w-10">
                                <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                  <span class="text-primary-700 font-medium text-sm">
                                    {(user.firstName?.[0] || '').toUpperCase()}{(user.lastName?.[0] || '').toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div class="ml-4">
                                <div class="text-sm font-medium text-neutral-900">{user.firstName} {user.lastName}</div>
                                <div class="text-sm text-neutral-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getRoleColor(user.role)}">
                              {user.role || 'Unknown'}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(user.status || 'active')}">
                              {user.status || 'active'}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{formatDate(user.lastLoginAt)}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{formatDate(user.createdAt)}</td>
                          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div class="flex items-center justify-end space-x-2">
                              <button on:click={() => openEditModal(user)} class="text-primary-600 hover:text-primary-900">Edit</button>
                              {#if user.id !== $currentUser.uid}
                                <button on:click={() => toggleUserStatus(user)} class="text-blue-600 hover:text-blue-900">{user.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                                <button on:click={() => deleteUser(user)} class="text-red-600 hover:text-red-900">Delete</button>
                              {/if}
                            </div>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Edit User Modal (simplified) -->
  {#if showEditModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-neutral-200">
          <h3 class="text-lg font-medium text-neutral-900">Edit User - {editingUser?.firstName} {editingUser?.lastName}</h3>
        </div>
        <form on:submit|preventDefault={handleUpdateUser} class="px-6 py-4 space-y-6">
          {#if errorMessage}
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
              <p class="text-sm text-red-700">{errorMessage}</p>
            </div>
          {/if}
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label for="firstName" class="block text-sm font-medium text-neutral-700">First Name *</label>
              <input type="text" id="firstName" bind:value={editForm.firstName} required class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label for="lastName" class="block text-sm font-medium text-neutral-700">Last Name *</label>
              <input type="text" id="lastName" bind:value={editForm.lastName} required class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-neutral-700">Email *</label>
              <input type="email" id="email" bind:value={editForm.email} required class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label for="role" class="block text-sm font-medium text-neutral-700">Role *</label>
              <select id="role" bind:value={editForm.role} required class="mt-1 block w-full border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                <option value="">Select role</option>
                <option value="admin">Admin</option>
                <option value="broker">Broker</option>
                <option value="assistant">Assistant</option>
                <option value="customer">Customer</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button type="button" on:click={closeEditModal} class="px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors">Cancel</button>
            <button type="submit" disabled={saving} class="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
              {#if saving}Saving...{:else}Update User{/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
{:else}
  <div class="min-h-screen flex items-center justify-center bg-neutral-50">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
      <p class="text-neutral-600">You need admin privileges to access this page.</p>
    </div>
  </div>
{/if} 