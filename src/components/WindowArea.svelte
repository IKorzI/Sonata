<script>
  import {
    aboutWindow,
    message,
    whatDocumentWindow,
    settingsWindow,
    themeMenuWindow,
  } from "../lib/store.js";

  import AboutWindow from "./AboutWindow.svelte";
  import ExampleWindow from "./ExampleWindow.svelte";
  import ErrorWindow from "./ErrorWindow.svelte";
  import SettingsWindow from "./SettingsWindow.svelte";
  import ThemeMenuWindow from "./ThemeMenuWindow.svelte";
</script>

<div
  class="window-area"
  class:showed={$aboutWindow ||
    $message.text ||
    $message.params?.messageFromTheBackendData ||
    $whatDocumentWindow ||
    $settingsWindow ||
    $themeMenuWindow}
  class:background={$aboutWindow ||
    $message.text ||
    $message.params?.messageFromTheBackendData ||
    $whatDocumentWindow ||
    $settingsWindow}
>
  <AboutWindow />

  <ExampleWindow />

  <ErrorWindow />

  <SettingsWindow />

  <ThemeMenuWindow />
</div>

<style>
  .window-area {
    position: absolute;
    top: 27px;
    left: 0;
    height: calc(100% - 27px);
    width: 100%;
    display: grid;
    place-items: center;
    opacity: 0;
    z-index: -1;
    transition: 0.4s;
    border-radius: 0px;
  }
  .window-area.background {
    background-color: var(--ErrorArea-background-color);
  }
  .window-area.showed {
    z-index: 3;
    opacity: 1;
  }
</style>
