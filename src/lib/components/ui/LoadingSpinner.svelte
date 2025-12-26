<script lang="ts">
	export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let color: 'primary' | 'white' | 'gray' = 'primary';
	export let label: string = 'Loading...';

	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8',
		xl: 'h-12 w-12'
	};

	const colorClasses = {
		primary: 'border-primary-600',
		white: 'border-white',
		gray: 'border-neutral-600'
	};
</script>

<div class="flex items-center justify-center">
	<div 
		class="loading-spinner {sizeClasses[size]} {colorClasses[color]}"
		role="status"
		aria-label={label}
	>
		<span class="sr-only">{label}</span>
	</div>
</div> 