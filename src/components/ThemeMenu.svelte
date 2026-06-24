<script>
  import { onMount, onDestroy } from "svelte";
  import { themeMenu, setTheme, lng } from "../lib/store.js";

  let _lng = {};
  lng.subscribe((value) => (_lng = value));

  let themeMenuIsOpen = false;

  function handleGlobalClick(event) {
    if (
      $themeMenu && 
      !event.target.closest('.themeMenu-window') &&
      !event.target.closest('.theme-swap') &&
      !event.target.className.includes("theme-menu")
    ) {
      themeMenu.set(false);
    }
  }

  onMount(() => {
    window.addEventListener("click", handleGlobalClick);
  });

  onDestroy(() => {
    window.removeEventListener("click", handleGlobalClick);
  });

  function setThemeHandler(event){
    const sourceText = event.target.parentElement.id
    const match = sourceText.match(/\d+$/);
    const number = String(match[0]);
    const type = sourceText.replace(/\d+$/, "");
    setTheme(type, number)
  }

</script>

<div class="themeMenu-area" class:showed={$themeMenu}>
  <div class="themeMenu-window" class:showed={$themeMenu}>
    <div class="title">{_lng?.themeMenu.title}</div>
    <div class="themes">
      <div class="theme" id="light1">
        <div class="title">{_lng?.themeMenu.light} 1</div>
        <div class="button" on:click={setThemeHandler}></div>
      </div>
      <div class="theme" id="light2">
        <div class="title">{_lng?.themeMenu.light} 2</div>
        <div class="button" on:click={setThemeHandler}></div>
      </div>
      <div class="theme" id="light3">
        <div class="title">{_lng?.themeMenu.light} 3</div>
        <div class="button" on:click={setThemeHandler}></div>
      </div>
      <div class="theme" id="dark1">
        <div class="title">{_lng?.themeMenu.dark} 1</div>
        <div class="button" on:click={setThemeHandler}></div>
      </div>
      <div class="theme" id="dark2">
        <div class="title">{_lng?.themeMenu.dark} 2</div>
        <div class="button" on:click={setThemeHandler}></div>
      </div>
      <div class="theme" id="dark3">
        <div class="title">{_lng?.themeMenu.dark} 3</div>
        <div class="button" on:click={setThemeHandler}></div>
      </div>
    </div>
  </div>
</div>

<style>
  .themeMenu-area {
    position: absolute;
    top: 27px;
    left: 0;
    height: calc(100% - 27px);
    width: 100%;
    background-color: transparent;
    opacity: 0;
    z-index: -1;
    transition: 0.4s;
    border-radius: 0px;
  }
  .themeMenu-area.showed {
    z-index: 3;
    opacity: 1;
  }

  .themeMenu-window {
    position: absolute;
    top: 0px;
    right: 0px;
    height: 100%;
    width: 200px;
    background-color: var(--ErrorArea-window-background-color);
    overflow: hidden;
    border-width: 2px;
    transform: translateX(+20px);
    display: grid;
    grid-template-rows: 40px 1fr;
    border-radius: 0px;
    border-width: 0px;
    border-left-width: 2px;
    transition: transform 0.4s;
  }
  .themeMenu-area .themeMenu-window.showed {
    transform: translateX(0px);
  }

  .title {
    height: 100%;
    display: grid;
    justify-content: center;
    align-items: center;
  }

  .themes {
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }
  .themes::-webkit-scrollbar {
    width: 8px;
  }
  .themes::-webkit-scrollbar-track {
    background: transparent;
  }
  .themes::-webkit-scrollbar-thumb {
    background-color: rgb(155, 155, 155);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  .themes::after {
    content: "";
    height: 0px;
  }

  .theme {
    height: 120px;
    box-sizing: border-box;
    display: grid;
    grid-template-rows: 20px 1fr;
    flex-shrink: 0;
  }

  .button {
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    cursor: pointer;
  }

  #light1 > .button {
    background-image: url(../light/preview1.png);
  }
  #light2 > .button {
    background-image: url(../light/preview2.png);
  }
  #light3 > .button {
    background-image: url(../light/preview3.png);
  }
  #dark1 > .button {
    background-image: url(../dark/preview1.png);
  }
  #dark2 > .button {
    background-image: url(../dark/preview2.png);
  }
  #dark3 > .button {
    background-image: url(../dark/preview3.png);
  }

</style>