<script>
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  
  // Вхідні параметри компонента
  export let id;
  export let text;
  
  let buttonElement;
  let parentId;

  const dispatch = createEventDispatcher();

  function handleClick() {
    // Відправка події кліку батьківському компоненту (ProgramMenu) для оновлення обраної секції
    dispatch('sectionclick', { id, parentId });
  }

  onMount(() => {
    // Автоматичне визначення ID батьківської групи секцій через DOM. 
    // Це дозволяє не передавати parentId вручну через props для кожної кнопки.
    parentId = buttonElement.closest('.group-of-sections').id;
  });
</script>

<button class='section-button' id={id} bind:this={buttonElement} on:click={handleClick}>
  <img class='section-icon' src='{id}.png' alt='{id}' />
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