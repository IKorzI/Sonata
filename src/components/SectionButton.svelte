<script>
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";

  export let id;
  export let text;
  let buttonElement;
  let parentId;

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch("sectionclick", { id, parentId });
  }

  onMount(() => {
    // Automatically find the parent group ID via the DOM so you don't have to pass the parentId prop to each component
    parentId = buttonElement.closest(".group-of-sections").id;
  });
</script>

<button
  class="section-button"
  {id}
  bind:this={buttonElement}
  on:click={handleClick}
>
  <img class="section-icon" src="{id}.png" alt={id} />
  {text}
</button>

<style>
  .section-button {
    height: 25px;
    width: 100%;
    display: flex;
    align-items: center;
    margin-bottom: 5px;
    background-color: var(--button-background-color2);
  }

  .section-icon {
    width: 18px;
    height: 18px;
    margin-left: 5px;
    margin-right: 5px;
  }

  .section-button:hover {
    background-color: var(--button-hover-background-color2);
  }
  .section-button:active {
    background-color: var(--button-active-background-color2);
  }
</style>
