<script>
  import { themeMenu, lng } from "../lib/store.js";

  let _lng = {};
  lng.subscribe((value) => (_lng = value));
</script>

<div class="themeMenu-area" class:showed={$themeMenu}>
  <div class="themeMenu-window" class:showed={$themeMenu}>
</div>

</div>

<style>
  .themeMenu-area {
    position: absolute;
    top: 27px;
    left: 0;
    height: calc(100% - 27px);
    width: 100%;
    background-color: var(--ErrorArea-background-color);
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
    top: 0px;
    right: 0px;
    height: 100%;
    width: 650px;
    background-color: var(--ErrorArea-window-background-color);
    overflow: hidden;
    position: relative;
    border-width: 2px;
    transform: translateY(+20px);
    display: grid;
    grid-template-rows: 30px 1fr 30px;
    transition: transform 0.4s;
  }
  .themeMenu-area .themeMenu-window.showed {
    transform: translateY(0px);
  }
</style>