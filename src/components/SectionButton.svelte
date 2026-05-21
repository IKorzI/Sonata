<script>
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  export let id;
  export let text;

  let buttonElement;
  let parentId;

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('sectionclick', { id, parentId });
  }

  onMount(() => {
    parentId = buttonElement.closest('.group-of-sections').id;
  });
</script>

<button class="section-button" id={id} bind:this={buttonElement} on:click={handleClick}>
  <img class="section-icon" src="{id}.png" alt="{id}" />
  {text}
</button>

<style>

  .section-button {
    height: 25px;
    width: 100%;
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }

  .section-icon {
    width: 18px;
    height: 18px;
    margin-left: 5px;
    margin-right: 5px;
  }
</style>