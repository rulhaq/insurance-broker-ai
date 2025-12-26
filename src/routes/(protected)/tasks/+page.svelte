<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
  import { db } from '$lib/config/firebase';
  import { currentUser } from '$lib/services/auth';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
  import { fade } from 'svelte/transition';
  
  let tasks: any[] = [];
  let loading = true;
  let searchTerm = '';
  let statusFilter = 'all';
  let priorityFilter = 'all';
  let showCompleteModal = false;
  let taskToComplete: any = null;

  // Pagination
  let currentPage = 1;
  let itemsPerPage = 10;

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const priorities = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  onMount(async () => {
    await loadTasks();
  });

  async function loadTasks() {
    loading = true;
    
    // Load real data from Firebase
    if (!$currentUser) return;
    
    try {
      const isAdmin = $currentUser.role === 'admin';
      
      // Admin sees ALL tasks, brokers see only their own
      const tasksQuery = isAdmin
        ? query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
        : query(
            collection(db, 'tasks'),
            where('brokerId', '==', $currentUser.uid),
            orderBy('createdAt', 'desc')
          );
      
      const tasksSnapshot = await getDocs(tasksQuery);
      
      tasks = tasksSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled Task',
          description: data.description || 'No description available',
          priority: data.priority || 'medium',
          status: data.status || 'pending',
          type: data.category || data.type || 'general',
          assignedTo: data.assignedTo || data.brokerId || 'unassigned',
          client: { 
            name: data.clientName || 'No Client', 
            id: data.clientId || 'none' 
          },
          dueDate: data.dueDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate() || null,
          brokerId: data.brokerId // Include broker info for admin view
        };
      });
      
      // If no real data, show some sample data for demo
      if (tasks.length === 0) {
        tasks = [
          {
            id: '1',
            title: 'Follow up on auto insurance quote',
            description: 'Contact John Smith regarding his auto insurance quote from last week',
            priority: 'high',
            status: 'pending',
            type: 'follow_up',
            assignedTo: isAdmin ? 'broker-001' : $currentUser.uid,
            client: { name: 'John Smith', id: 'client1' },
            dueDate: new Date('2024-01-25'),
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-01-20'),
            brokerId: isAdmin ? 'broker-001' : $currentUser.uid
          },
          {
            id: '2',
            title: 'Process home insurance renewal',
            description: 'Review and process renewal for Sarah Johnson\'s homeowners policy',
            priority: 'medium',
            status: 'in_progress',
            type: 'renewal',
            assignedTo: isAdmin ? 'broker-002' : $currentUser.uid,
            client: { name: 'Sarah Johnson', id: 'client2' },
            dueDate: new Date('2024-01-30'),
            createdAt: new Date('2024-01-18'),
            updatedAt: new Date('2024-01-22'),
            brokerId: isAdmin ? 'broker-002' : $currentUser.uid
          }
        ];
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      tasks = [];
    }
    
    loading = false;
  }

  $: filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.client.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  $: paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  $: totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  function getStatusBadge(status: string) {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  }

  function getPriorityBadge(priority: string) {
    const badges = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return badges[priority as keyof typeof badges] || badges.medium;
  }

  function getTypeIcon(type: string) {
    const icons = {
      follow_up: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L6.51 11.13a.992.992 0 00-.335 1.345l.114.221a.992.992 0 00.335.221 3.003 3.003 0 003.146-.781l.664-.664a.992.992 0 011.345.335c.22.44.781.664 1.21.335l2.24-1.24a1 1 0 011.21.502l4.493 1.498A1 1 0 0120 16.723V20a2 2 0 01-2 2H5a2 2 0 01-2-2V5z',
      renewal: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      assessment: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      claim: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      meeting: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return icons[type as keyof typeof icons] || icons.follow_up;
  }

  function handleCreateTask() {
    goto('/tasks/new');
  }

  function handleViewTask(id: string) {
    goto(`/tasks/${id}`);
  }

  function handleEditTask(id: string) {
    goto(`/tasks/${id}/edit`);
  }

  async function updateTaskStatus(taskId: string, newStatus: string) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].status = newStatus;
      tasks[taskIndex].updatedAt = new Date();
      if (newStatus === 'completed') {
        tasks[taskIndex].completedAt = new Date();
      }
      tasks = [...tasks];
    }
  }

  function confirmComplete(task: any) {
    taskToComplete = task;
    showCompleteModal = true;
  }

  async function handleComplete() {
    if (!taskToComplete) return;
    
    await updateTaskStatus(taskToComplete.id, 'completed');
    
    showCompleteModal = false;
    taskToComplete = null;
  }

  function formatDate(date: Date | null) {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US').format(date);
  }

  function isOverdue(task: any) {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    return task.dueDate && task.dueDate < new Date();
  }

  function isDueSoon(task: any) {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    if (!task.dueDate) return false;
    const daysUntilDue = Math.ceil((task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3 && daysUntilDue >= 0;
  }
</script>

<svelte:head>
  <title>Tasks - Insurance Broker Pro</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-neutral-900">Tasks</h1>
      <p class="mt-1 text-sm text-neutral-600">
        Manage your daily tasks and workflow
      </p>
    </div>
    <div class="mt-4 sm:mt-0">
      <button
        on:click={handleCreateTask}
        class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
      >
        Create Task
      </button>
    </div>
  </div>

  <!-- Search and Filters -->
  <div class="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label for="search" class="block text-sm font-medium text-neutral-700 mb-2">
          Search
        </label>
        <input
          id="search"
          type="text"
          bind:value={searchTerm}
          placeholder="Search tasks, clients, or descriptions..."
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div>
        <label for="status" class="block text-sm font-medium text-neutral-700 mb-2">
          Status
        </label>
        <select
          id="status"
          bind:value={statusFilter}
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {#each statuses as status}
            <option value={status.value}>{status.label}</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label for="priority" class="block text-sm font-medium text-neutral-700 mb-2">
          Priority
        </label>
        <select
          id="priority"
          bind:value={priorityFilter}
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          {#each priorities as priority}
            <option value={priority.value}>{priority.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  {:else}
    <!-- Tasks Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each paginatedTasks as task (task.id)}
        <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow" transition:fade>
          <!-- Task Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getTypeIcon(task.type)} />
                </svg>
              </div>
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize {getPriorityBadge(task.priority)}">
                {task.priority}
              </span>
            </div>
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize {getStatusBadge(task.status)}">
              {task.status.replace('_', ' ')}
            </span>
          </div>

          <!-- Task Content -->
          <h3 class="text-lg font-semibold text-neutral-900 mb-2">{task.title}</h3>
          <p class="text-neutral-600 text-sm mb-4 line-clamp-3">{task.description}</p>

          <!-- Client Info -->
          <div class="flex items-center text-sm text-neutral-600 mb-4">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div class="flex flex-col">
              <span>{task.client.name}</span>
              {#if $currentUser?.role === 'admin' && task.brokerId}
                <span class="text-xs text-blue-600">Broker: {task.brokerId}</span>
              {/if}
            </div>
          </div>

          <!-- Due Date -->
          <div class="flex items-center text-sm mb-4">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-neutral-600 {isOverdue(task) ? 'text-red-600 font-medium' : isDueSoon(task) ? 'text-orange-600 font-medium' : ''}">
              Due: {formatDate(task.dueDate)}
              {#if isOverdue(task)}
                (Overdue)
              {:else if isDueSoon(task)}
                (Due Soon)
              {/if}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-4 border-t border-neutral-200">
            <div class="flex space-x-2">
              <button
                on:click={() => handleViewTask(task.id)}
                class="text-primary-600 hover:text-primary-900 text-sm font-medium"
              >
                View
              </button>
              {#if ($currentUser?.role === 'admin' || task.brokerId === $currentUser?.uid) && task.status !== 'completed' && task.status !== 'cancelled'}
                <button
                  on:click={() => handleEditTask(task.id)}
                  class="text-neutral-600 hover:text-neutral-900 text-sm font-medium"
                >
                  Edit
                </button>
              {/if}
            </div>
            
            {#if ($currentUser?.role === 'admin' || task.brokerId === $currentUser?.uid) && task.status !== 'completed' && task.status !== 'cancelled'}
              <div class="flex space-x-2">
                {#if task.status === 'pending'}
                  <button
                    on:click={() => updateTaskStatus(task.id, 'in_progress')}
                    class="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full hover:bg-blue-200 transition-colors"
                  >
                    Start
                  </button>
                {/if}
                <button
                  on:click={() => confirmComplete(task)}
                  class="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full hover:bg-green-200 transition-colors"
                >
                  Complete
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex items-center justify-center space-x-2 pt-6">
        <button
          on:click={() => currentPage = Math.max(1, currentPage - 1)}
          disabled={currentPage === 1}
          class="px-3 py-1 text-sm bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
          {#if page === currentPage}
            <span class="px-3 py-1 text-sm bg-primary-600 text-white rounded-md">
              {page}
            </span>
          {:else}
            <button
              on:click={() => currentPage = page}
              class="px-3 py-1 text-sm bg-white border border-neutral-300 rounded-md hover:bg-neutral-50"
            >
              {page}
            </button>
          {/if}
        {/each}
        
        <button
          on:click={() => currentPage = Math.min(totalPages, currentPage + 1)}
          disabled={currentPage === totalPages}
          class="px-3 py-1 text-sm bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    {/if}
  {/if}
</div>

<!-- Complete Confirmation Modal -->
{#if showCompleteModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" transition:fade>
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-medium text-neutral-900 mb-4">Complete Task</h3>
      <p class="text-neutral-600 mb-6">
        Are you sure you want to mark "{taskToComplete?.title}" as completed?
      </p>
      <div class="flex justify-end space-x-3">
        <button
          on:click={() => showCompleteModal = false}
          class="px-4 py-2 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          on:click={handleComplete}
          class="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
        >
          Complete
        </button>
      </div>
    </div>
  </div>
{/if} 