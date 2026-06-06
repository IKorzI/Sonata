<script>
  import { message, lng } from '../lib/store.js'

  let _lng = {};
  lng.subscribe(value => (_lng = value));
  
  let errorText = '';
  let errorType = '';
  $: if ($message) {
    if ($message.text === '') {
      setTimeout(() => {
        errorText = '';
        errorType = '';
      }, 400);
    } else {
      errorText = $message.text;
      errorType = $message.type === 'warning' ? _lng.errorWindow.errorWindow.title.warning : _lng.errorWindow.errorWindow.title.error;
    }
  }

  function handlerClickOK() {
    message.set({type: '', text: ''});
  }

</script>

<div class="error-area" class:showed={$message.text}>

  <div class="error-window" class:showed={$message.text}>
    <div class="title">{errorType}</div>
    <div class="text-area">{errorText}</div>
    <button class="ok" on:click={handlerClickOK}>OK</button>
  </div>

</div>

<style>

  .error-area {
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
  }
  :global(.error-area.showed) {
    z-index: 1;
    opacity: 1;
  }

  .error-window {
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
  }
  :global(.error-area .error-window.showed) {
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

  .text-area {
    padding: 10px;
    overflow-y: auto;
    white-space: pre-wrap;
  }

  .ok {
    display: grid;
    text-align: center;
    align-items: center;
    font-size: 20px;
    border-radius: 0px;
    border-top-width: 2px;
    cursor: pointer;
  }

  /* Скрываем скроллбар для Chrome, Edge, Safari */
  .text-area::-webkit-scrollbar {
    width: 8px;
  }
  /* Дорожка */
  .text-area::-webkit-scrollbar-track {
    background: transparent;
  }
  /* Ползунок */
  .text-area::-webkit-scrollbar-thumb {
    background-color: var(--button-background-color1);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  /* При наведении */
  .text-area::-webkit-scrollbar-thumb:hover {
    background-color: var(--button-hover-background-color1);
  }

</style>
