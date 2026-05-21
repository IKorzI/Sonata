<script>
  import { onMount } from 'svelte';
  import { savedInformation, selectedSection } from '../../lib/store.js'

  // ========== ЗАПОЛНИТЬ ==========
  let thisId = 'other--other';
  // ===============================

  let this_, isScreenshotMode = false
  let eSemester1Start, eSemester1End, eSemester2Start, eSemester2End

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

  function screenshotMode() {
    if (!window.electron) return;
    window.electron.screenshotMode(!isScreenshotMode);
    isScreenshotMode = !isScreenshotMode
  }

  onMount(() => {
    if (window.electron?.onExcelHtml) {
      window.electron.onExcelHtml(html => {
        window.electron.sendToMain("excel-html", html);
      });
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const semNum = month >= 7 ? 1 : 2
    
    eSemester1Start.value  = semNum === 1  ?  `01.09.${year}`      :  `01.09.${year - 1}`
    eSemester1End.value    = semNum === 1  ?  `31.12.${year}`      :  `31.12.${year - 1}`
    eSemester2Start.value  = semNum === 1  ?  `01.01.${year + 1}`  :  `01.01.${year}`
    eSemester2End.value    = semNum === 1  ?  `30.06.${year + 1}`  :  `30.06.${year}`
  });

  async function numDenStart() {
    const targetPath = await window.electron.saveDialog("Чисельник Знаменник", ".xlsx");
    if (!targetPath) return;
    savedInformation.set({
      id: `${thisId}--num-den`,
      semester1Start: eSemester1Start.value,
      semester1End: eSemester1End.value,
      semester2Start: eSemester2Start.value,
      semester2End: eSemester2End.value,
      filePath: targetPath
    });
  }

</script>

<div class="gui" id={thisId} style:opacity={$selectedSection === thisId ? 1 : 0} bind:this={this_}>

  <div class="block" id="screenshot-mode">
    <div class="label">Режим скріншота</div>
    <button class={`screenshot-mode ${isScreenshotMode ? 'active' : ''}`} on:click={() => screenshotMode()}>Режим скріншота</button>
  </div>
  
  <div class="block" id="num-den">
    <div class="label">Чисельник/знаменник</div>
    <div class="input-block" id="start1">
      <div>Початок семестра 1</div>
      <input type="text" bind:this={eSemester1Start}/>
    </div>
    <div class="input-block" id="end1">
      <div>Кінець семестра 1</div>
      <input type="text" bind:this={eSemester1End}/>
    </div>
    <div class="input-block" id="start2">
      <div>Початок семестра 2</div>
      <input type="text" bind:this={eSemester2Start}/>
    </div>
    <div class="input-block" id="end2">
      <div>Кінець семестра 2</div>
      <input type="text" bind:this={eSemester2End}/>
    </div>
    <button class="start" on:click={() => numDenStart()}>Старт</button>
  </div>

</div>

<style>

  .gui {
    display: flex;
    flex-wrap: wrap;
    column-gap: 15px;
    row-gap: 20px;
    align-content: flex-start;
    align-items: flex-start;
  }

  .block {
    border-radius: 20px;
    border-style: dashed;
    border-width: 3px;
    width: fit-content;
    height: auto;
    padding: 15px;

    display: flex;
    flex-direction: column;
    align-items: center;
    
    gap: 10px;
  }

  .label {
    position: relative;
    top: -5px;
  }

  button {
    height: 40px;
    width: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-width: 2px;
  }

  .input-block {
    display: grid;
    grid-template-columns: 170px 95px;
  }

  .screenshot-mode {
    height: 60px;
    width: 200px;
    font-size: 20px;
    border-width: 5px;
  }
  :global(.screenshot-mode.active) {
    background-color: rgba(0, 255, 120, 0.4);
    border-color: rgb(0, 159, 14);
  }

</style> 