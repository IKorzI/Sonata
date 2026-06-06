<script>
  import { onMount, onDestroy } from 'svelte';
  import { availableLngs, changeLanguage, lng, transition, themeSwap, hide } from '../lib/store.js'
  let _lng = {};
  lng.subscribe(value => (_lng = value));
  let languageListIsOpen = false;
  
  function handleGlobalClick(event) {
    if (!event.target.className.includes("language") && event.target.tagName !== 'LI' && languageListIsOpen) {
      const languageList = document.querySelector('.title-bar .language-list');
      languageList.style.opacity = '';
      languageList.style.zIndex = '';
      languageListIsOpen = false;
    }
  }

  onMount(() => {
    const languageList = document.querySelector('.title-bar .language-list');
    availableLngs.forEach((lng, index) => {
      const li = document.createElement('li');
      li.textContent = lng;
      if (index === availableLngs.length - 1) {
        li.className = "last";
      }
      li.addEventListener('click', function (event) {
        changeLanguage(event.target.textContent)
        languageList.style.opacity = '';
        languageList.style.zIndex = '';
        languageListIsOpen = false;
      })
      languageList.appendChild(li);
    });

    window.addEventListener('click', handleGlobalClick);
  });
  
  onDestroy(() => {
    window.removeEventListener('click', handleGlobalClick);
  });

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

  function showLngList() {
    if (!languageListIsOpen) {
      const languageList = document.querySelector('.title-bar .language-list');
      languageList.style.zIndex = '999';
      languageList.style.opacity = '1'
      languageListIsOpen = true;
    } else {
      const languageList = document.querySelector('.title-bar .language-list');
      languageList.style.opacity = '';
      languageList.style.zIndex = '';
      languageListIsOpen = false;
    }
  }
  
</script>

<div class="title-bar">
  <div class="program-icon"></div>
  <button class="language" on:click={showLngList}>{_lng.lng}</button>
  <ul class="language-list"></ul>
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
    grid-template-columns: 25px 25px 1fr 25px 25px 25px;
    background-color: var(--background-color);
    border-radius: 0px;
    border-color: var(--border-color1);
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
  button:hover {
    background-color: var(--button-hover-background-color2);
  }
  button:active {
    background-color: var(--button-active-background-color2);
  }

  .program-icon {
    border-top-left-radius: 7.5px;
    background-image: url('../icon.png');
  }

  /*
    ".title-bar .language", потому что просто ".language" слабее чем ".title-bar > *:not(.language-list)",
    а в нём прописан стиль "font-weight: bold" и чтобы его перебить нужно сделать стиль более
    специфичным, а для этого нужно добавить ".title-bar"
  */
  .title-bar .language {
    font-weight: normal;
  }

  .language-list {
    position: absolute;
    height: 85px;
    top: 26px;
    left: 25px;
    opacity: 0;
    z-index: -1;
  }

  :global(.language-list li) {
    cursor: pointer;
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