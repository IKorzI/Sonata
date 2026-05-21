<script>
  // import { whatDocument } from '../lib/store.js'
  
  // $:
  // if ($whatDocument) {
    
  // } else {
    
  // }

  function handleSave() {
    
  }
  function handleCancel() {
    
  }
</script>

<!-- svelte-ignore missing-declaration -->
<!-- svelte-ignore a11y-no-static-element-interactions -->

<!-- <div class="screenshot-area" class:showed={$whatDocument}>
  <div class="screenshot-window" class:showed={$whatDocument}> -->
<div class="screenshot-area">
  <div class="screenshot-window">
    <div class="title">Зберегти як зображення</div>
    <div class="data">
      <div class="fileNameTitle">Ім'я файла на робочому столі</div>
      <input type="text" class="fileName">
      <input type="text" class="scaleSize">
    </div>
    <div class="buttons">
      <button class="cancel" on:click|stopPropagation={handleCancel}>Скасувати</button>
      <button class="save" on:click|stopPropagation={handleSave}>Зберегти</button>
    </div>
  </div>
</div>

<style>
  .screenshot-area {
    position: absolute;
    top: 27px;
    left: 0;
    height: calc(100% - 27px);
    width: 100%;
    background-color: var(--ErrorArea-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    z-index: -1;
    transition: 0.4s;
    border-radius: 0px;

    
    z-index: 1;
    opacity: 1;
  }
  :global(.screenshot-area.showed) {
    z-index: 1;
    opacity: 1;
  }

  .screenshot-window {
    height: 250px;
    width: 450px;
    background-color: var(--ErrorArea-window-background-color);
    overflow: hidden;
    position: relative;
    border-width: 2px;
    transform: translateY(+20px);
    display: grid;
    grid-template-rows: 30px 1fr 30px;
    transition: transform 0.4s;


    transform: translateY(0px);
  }
  :global(.screenshot-area .screenshot-window.showed) {
    transform: translateY(0px);
  }

  .title {
    display: grid;
    text-align: center;
    align-items: center;
    font-size: 20px;
    font-weight: bold;
    border-bottom-width: 2px;
    border-radius: 0px;
  }

  .buttons {
    display: grid;
    grid-template-columns: calc(50% + 1px) calc(50% - 1px);
    border-radius: 0px;
    border-top-width: 2px;
  }

  button {
    display: grid;
    text-align: center;
    align-items: center;
    font-size: 20px;
    border-radius: 0px;
    cursor: pointer;
  }
  .cancel {
    border-right-width: 2px;
  }

</style>
