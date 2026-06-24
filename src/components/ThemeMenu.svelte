<script>
  import { themeMenu, lng } from "../../lib/store.js";

  let _lng = {};
  lng.subscribe((value) => (_lng = value));
</script>

<div class="theme-menu" class:showed={$themeMenu}>
  
</div>

<style>
  .theme-menu {
    
  }
</style>