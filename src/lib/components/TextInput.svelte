<script lang="ts">
	export let text: string;
	export let name: string;
	export let placeholder: string;
</script>

<div class="input-group grid-cols-[1fr_auto]">
	<input
		class="input pl-4 rounded-br-none rounded-tr-none"
		type="text"
		{name}
		autocomplete="off"
		{placeholder}
		bind:value={text}
	/>
	<div><slot name="icon" /></div>
</div>
