<script>
  import { selectedSection } from '../../lib/store.js'
  import FileOutput from '../FileOutput.svelte';

  // ========== ЗАПОЛНИТЬ ==========
  let thisId = 'other--templates';
  // ===============================

  let this_

  $: if ($selectedSection) {
    if (this_) {
      if ($selectedSection === thisId) {
        this_.style.zIndex = null;
      } else if (this_.style.zIndex !== "-1") {
        setTimeout(() => {
          this_.style.zIndex = -1;
        }, 200);
      }
    }
  }
</script>

<div class="gui" id={thisId} style:opacity={$selectedSection === thisId ? 1 : 0} bind:this={this_}>

  <FileOutput eId='statements' type='excel'/>
  <FileOutput eId='hours' type='excel'/>
  <FileOutput eId='contingent' type='excel'/>

</div>

<style>

  .gui {
    display: flex;
    flex-wrap: wrap;
    column-gap: 15px;
    row-gap: 20px;
    align-content: flex-start;
  }

  :global(.file-output#hours--based-on-the-first-month--hours .label) {
    position: relative;
    width: calc(100% + 20px);
    left: -10px;
  }

</style> 