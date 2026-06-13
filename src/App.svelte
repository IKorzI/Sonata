<script>
  import { transition, styles, hide } from './lib/store.js';
  let _styles = {};
  let _transition;
  styles.subscribe(value => (_styles = value));
  transition.subscribe(value => (_transition = value));

  import TitleBar from './components/TitleBar.svelte';
  import ProgramMenu from './components/ProgramMenu.svelte';
  import Workspace from './components/Workspace.svelte';
  import ExampleWindows from './components/ExampleWindow.svelte';
  import ErrorWindows from './components/ErrorWindow.svelte';
</script>

<main class="program {$hide ? 'hide' : ''}" style='

  --transition: {_transition};

  --app-background-image: {_styles.app.background.image};
  --themeSwap-background-image: {_styles.themeSwap.background.image};
  --settingsButton-background-image: {_styles.settingsButton.background.image};
  --programMenu-background-image: {_styles.programMenu.background.image};
  --add-background-image: {_styles.add.background.image};
  --choiceMark-color: {_styles.choiceMark.color};
  --editStatus-background-image: {_styles.editStatus.background.image};
  --startProcess-background-image: {_styles.startProcess.background.image};

  --ExampleArea-background-color: {_styles.ExampleArea.background.color};
  --ExampleArea-window-background-color: {_styles.ExampleArea.window.background.color};
  --ExampleArea-window-download-background-image: {_styles.ExampleArea.window.download.background.image};
  --ExampleArea-window-scaleUp-background-image: {_styles.ExampleArea.window.scaleUp.background.image};
  --ExampleArea-window-scaleByWidth-background-image: {_styles.ExampleArea.window.scaleByWidth.background.image};
  --ExampleArea-window-scaleDown-background-image: {_styles.ExampleArea.window.scaleDown.background.image};
  --ExampleArea-window-button-background-color: {_styles.ExampleArea.window.button.background.color};
  --ExampleArea-window-button-hover-background-color: {_styles.ExampleArea.window.button.hover.background.color};
  --ExampleArea-window-button-active-background-color: {_styles.ExampleArea.window.button.active.background.color};
  --ExampleArea-window-close-background-color: {_styles.ExampleArea.window.close.background.color};
  --ExampleArea-window-close-hover-background-color: {_styles.ExampleArea.window.close.hover.background.color};
  --ExampleArea-window-close-active-background-color: {_styles.ExampleArea.window.close.active.background.color};
  --ExampleArea-tabArea-background-color: {_styles.ExampleArea.tabArea.background.color};

  --ErrorArea-background-color: {_styles.ErrorArea.background.color};
  --ErrorArea-window-background-color: {_styles.ErrorArea.window.background.color};

  --inputFile-delete-background-image: {_styles.inputFile.delete.background.image};
  --inputFile-what-background-image: {_styles.inputFile.what.background.image};

  --background-color: {_styles.background.color};
  --background-reverse-color: {_styles.background.reverse.color};
  --border-color1: {_styles.border.color1};
  --border-color2: {_styles.border.color2};
  --text-color: {_styles.text.color};

  --button-background-color1: {_styles.button.background.color1};
  --button-background-color2: {_styles.button.background.color2};
  --button-hover-background-color1: {_styles.button.hover.background.color1};
  --button-hover-background-color2: {_styles.button.hover.background.color2};
  --button-active-background-color1: {_styles.button.active.background.color1};
  --button-active-background-color2: {_styles.button.active.background.color2};

  --input-placeholder-color: {_styles.input.placeholder.color};
  --input-background-color: {_styles.input.background.color};
  --input-hover-background-color: {_styles.input.hover.background.color};
  --input-focus-background-color: {_styles.input.focus.background.color};
  --input-border-color: {_styles.input.border.color};
  --input-focus-border-color: {_styles.input.focus.border.color};

  --ul-background-color: {_styles.ul.background.color};
  --ul-border-color: {_styles.ul.border.color};
  --li-hover-background-color: {_styles.li.hover.background.color};
  --li-active-background-color: {_styles.li.active.background.color};
'>
  <TitleBar />

  <ProgramMenu />
  
  <Workspace />

  <ExampleWindows />

  <ErrorWindows />

</main>

<style>
  .program {
    position: absolute;
    top: 0px;
    left: 0px;
    overflow: hidden;
    width: 1000px; 
    min-width: 1000px;
    aspect-ratio: 5/3;
    border-radius: 10px;
    border-width: 2px;
    background-size: cover;
    background-image: var(--app-background-image);
    border-color: var(--border-color1);
  }
  .program.hide {
    opacity: 0;
  }
  
  :global(.program, .program *) {
    user-select: none;
    cursor: default;
    font-family: 'Calibri';
    font-size: 17px;
    color: var(--text-color);
    transition: var(--transition);
    border-color: var(--border-color1);
    border-width: 0px;
    border-style: solid;
    border-radius: 8px;
    padding: 0;
    margin: 0;
    text-align: left;
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 100%;
    white-space: pre-line;
  }

  :global(.program img, .program .img) {
    border-radius: 0px;
  }
  
  :global(.program .gui) {
    position: absolute;
    transition: 0.2s;
    z-index: -1;
    height: 100%;
    width: 100%;
  }

  :global(.program button) {
    cursor: pointer;
    background-color: var(--button-background-color1);
  }
  :global(.program button:hover) {
    background-color: var(--button-hover-background-color1);
  }
  :global(.program button.hovered) {
    background-color: var(--button-hover-background-color1);
  }
  :global(.program button:active) {
    background-color: var(--button-active-background-color1);
  }
  :global(.program button.unwork) {
    pointer-events: none;
  }

  :global(.program input) {
    border-color: var(--input-border-color);
    background-color: var(--input-background-color);
    border-width: 1px;
    border-radius: 3px;
    cursor: text;
    padding-left: 4px;
  }
  :global(.program input::placeholder) {
    color: var(--input-placeholder-color);
    transition: 0.2s;
  }
  :global(.program input:hover) {
    background-color: var(--input-hover-background-color);
  }
  :global(.program input:focus) {
    border-color: var(--input-focus-border-color);
    background-color: var(--input-hover-background-color);
    outline: none;
  }
  
  :global(.program ul) {
    list-style: none;
    background-color: var(--ul-background-color);
    border-width: 1px;
    border-radius: 5px;
    border-color: var(--ul-border-color);
    overflow: auto;
    width: fit-content;
  }
  :global(.program ul::-webkit-scrollbar) {
    display: none;
  }
  :global(.program li) {
    width: auto;
    padding: 3px 5px;
    border-bottom-width: 1px;
    border-color: var(--ul-border-color);
    border-radius: 0px;
  }
  :global(.program li:hover) {
    background-color: var(--li-hover-background-color);
  }
  :global(.program li:active) {
    background-color: var(--li-active-background-color);
  }
  :global(.program li:last-child) {
    border: none;
  }

  :global(.program .unavailable) {
    pointer-events: none;
  }

</style> 