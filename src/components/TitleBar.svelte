<script>
  import {
    lng,
    transition,
    themeSwap,
    hide,
    aboutWindow,
    settingsWindow,
    themeMenuWindow,
  } from "../lib/store.js";

  let _lng = {};
  lng.subscribe((value) => (_lng = value));

  // Flag to block repeated clicks on window control elements during animation playback
  let isProcess = false;

  function handleMinimize() {
    if (isProcess) return;
    isProcess = true;
    transition.set("0.2s");

    hide.set(true);
    // We allow 200ms for the CSS fade-out animation to play before minimizing the window at the OS level
    setTimeout(() => {
      if (window.electron) {
        window.electron.minimize();
      }

      // Restore visibility immediately after minimizing so that the window isn't transparent when restored from the taskbar
      setTimeout(() => {
        hide.set(false);
      }, 100);

      transition.set("0s");
      isProcess = false;
    }, 200);
  }

  function handleClose() {
    if (isProcess) return;
    isProcess = true;
    transition.set("0.2s");

    hide.set(true);
    // A similar delay for a smooth fade-out before completely closing the application
    setTimeout(() => {
      if (window.electron) {
        window.electron.close();
      }
      transition.set("0s");
      isProcess = false;
    }, 200);
  }

  function handleThemeSwap() {
    if (isProcess) return;
    isProcess = true;
    transition.set("0.2s");

    themeSwap();
    setTimeout(() => {
      transition.set("0s");
      isProcess = false;
    }, 200);
  }

  function showAbout() {
    aboutWindow.set(true);
  }

  function showSettings() {
    settingsWindow.set(true);
  }

  function showThemeMenuWindow() {
    themeMenuWindow.set(!$themeMenuWindow);
  }
</script>

<div class="title-bar">
  <div class="program-name">Sonata</div>
  <div class="program-icon"></div>
  <button class="about" on:click={showAbout}></button>
  <button class="settings" on:click={showSettings}></button>
  <button class="update">{_lng?.titleBar.update}</button>
  <div class="drag-region"></div>
  <button class="theme-menu" on:click={showThemeMenuWindow}></button>
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
    grid-template-columns: 25px 25px 25px 85px 1fr 25px 25px 25px 25px;
    background-color: var(--background-color);
    border-radius: 0px;
    border-color: var(--border-color);
  }

  .title-bar > * {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    z-index: 2;
  }

  button {
    background-color: transparent;
    border: none;
    border-radius: 0px;
  }
  button:hover {
    background-color: var(--button-hover-background-color);
  }
  button:active {
    background-color: var(--button-active-background-color);
  }

  .program-name {
    position: absolute;
    font-weight: normal;
    font-size: 20px;
    width: 100%;
    z-index: 1;
  }

  .program-icon {
    border-top-left-radius: 7.5px;
    background-image: url("../icon.png");
  }

  .drag-region {
    -webkit-app-region: drag;
  }

  .settings {
    background-image: var(--TitleBar--settings-background-image);
  }

  .about {
    background-image: var(--TitleBar--about-background-image);
  }

  .theme-menu {
    background-image: var(--TitleBar--themeMenu-background-image);
  }

  .theme-swap {
    background-image: var(--TitleBar--themeSwap-background-image);
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
