<script>
  import { selectedSection } from '../../lib/store.js'

  // ========== ЗАПОЛНИТЬ ==========
  let thisId = 'session--template';
  // ===============================

  let this_

  $: if ($selectedSection) {
    if (this_) {
      if ($selectedSection === thisId) {
        this_.style.zIndex = "1";
      } else if (this_.style.zIndex !== "-1") {
        setTimeout(() => {
          this_.style.zIndex = -1;
        }, 200);
      }
    }
  }
</script>

<div class="gui" id={thisId} style:opacity={$selectedSection === thisId ? 1 : 0} bind:this={this_}>



</div>

<style>
  
</style> 