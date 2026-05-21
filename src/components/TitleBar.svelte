<script>
  import { transition, themeSwap, hide } from '../lib/store.js'
  let isProcess = false;

  function handleMinimize() {
    if (isProcess) return;
    isProcess = true;
    transition.set('0.2s');

    hide.set(true);
    setTimeout(() => {
      if (window.electron) {
        window.electron.minimize();
      }
      setTimeout(() => {
        hide.set(false);
      }, 100);
      transition.set('0s');
      isProcess = false;
    }, 200);
  }

  function handleClose() {
    if (isProcess) return;
    isProcess = true;
    transition.set('0.2s');

    hide.set(true);
    setTimeout(() => {
      if (window.electron) {
        window.electron.close();
      }
      transition.set('0s');
      isProcess = false;
    }, 200);
  }

  function handleThemeSwap() {
    if (isProcess) return;
    isProcess = true;
    transition.set('0.2s');

    themeSwap();
    setTimeout(() => {
      transition.set('0s');
      isProcess = false;
    }, 200);
  }
</script>

<div class="title-bar">
  <div class="program-icon"></div>
  <div class="program-name">Sonata</div>
  <button class="theme-swap" on:click={handleThemeSwap}></button>
  <button class="minimize" on:click={handleMinimize}>—</button>
  <button class="close" on:click={handleClose}>✕</button>
</div>

<style>
  .title-bar {
    height: 25px;
    width: 100%;
    border-bottom-width: 2px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    display: grid;
    grid-template-columns: 25px 1fr 25px 25px 25px;
    background-color: var(--background-color);
    border-radius: 0px;
  }

  .title-bar > *:not(.language-list) {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }

  button {
    background-color: transparent;
    border: none;
    border-radius: 0px;
  }

  .program-icon {
    border-top-left-radius: 7.5px;
    background-image: url('../icon.png');
  }

  .program-name {
    -webkit-app-region: drag;
    font-weight: normal;
    font-size: 20px;
  }

  .theme-swap {
    background-image: var(--themeSwap-background-image);
  }

  .close {
    border-top-right-radius: 8px;
  }

  .close:hover {
    background-color: rgba(255, 59, 59, 0.9);
  }

  .close:active {
    background-color: rgba(255, 59, 59, 0.5);
  }
</style>