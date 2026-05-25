<script>
  import { selectedSection, clearInformation, saveInformation, savedInformation, message } from '../../lib/store.js'
  import FileInput from '../FileInput.svelte';

  // ========== ЗАПОЛНИТЬ ==========
  let thisId = 'session--debtors';
  // ===============================

  let this_
  let loadedGroups = [];

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
  $: if ($clearInformation) {
    if ($clearInformation === thisId) {
      clearAll()
      setTimeout(() => {
        clearInformation.set(null)
      }, 50)
    }
  }
  $: if ($saveInformation) {
    if ($saveInformation === thisId) {
      saveAll()
      saveInformation.set(null)
    }
  }

  function clearAll() {
    loadedGroups = [];
  }

  async function saveAll() {
    let endInformation = {
      id: thisId,
      filePath: loadedGroups[0].filePath,
      groups: loadedGroups,
    }
    console.log(endInformation)
    endInformation = await window.electron.sessionDebtorsDataSupplement(endInformation);
    console.log(endInformation)
    savedInformation.set(endInformation);
  }

  async function handleFileInputChange(detail) {
    if (!window.electron) return;
    if (detail.id === 'session--debtors--statements') {
      const uploadedFile = detail.file;
      const data = await window.electron.sessionDebtorsGetInformation(uploadedFile.path);
      for (const group of loadedGroups) {
        if (group.groupCode === data.groupCode) {
          message.set({type: 'error', text: `Група ${group.groupCode} вже завантажена.`});
          return;
        }
      }
      loadedGroups = [...loadedGroups, {...data, filePath: uploadedFile.path}];
      console.log(loadedGroups);
    }
  }
  async function handleFileRemove(detail) {
    return
  }

  function handleRemoveRow(index) {
    loadedGroups.splice(index, 1);
    loadedGroups = [...loadedGroups];
  }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->

<div class="gui" id={thisId} style:opacity={$selectedSection === thisId ? 1 : 0} bind:this={this_}>

  <FileInput eId='session--debtors--statements' extensions={['.xlsx']} type='excel'
    on:fileSelected={event => handleFileInputChange(event.detail)}
    on:fileRemoved={event => handleFileRemove(event.detail)}
  />

  <div class="loaded-groups">
    <div class="label">Завантажені групи</div>
    <div class="list">
      {#each loadedGroups as group}
        <div class="row" id={group.groupCode}>
          <div class="groupCode">{group.groupCode}</div>
          <div class="specialityCodes">{group.specialityCodes.join(', ')}</div>
          <div class="remove" on:click={() => handleRemoveRow(loadedGroups.indexOf(group))}>✕</div> 
        </div>
      {/each}
    </div>
  </div>

</div>

<style>
  
  :global(.file-input#session--debtors--statements) {
    position: absolute;
  }
  :global(.file-input#session--debtors--statements .label) {
    position: relative;
    width: calc(100% - 20px);
    left: calc(50% - (100% - 20px) / 2);
  }

  .loaded-groups {
    position: absolute;
    top: 30px;
    left: 200px;
    height: 230px;
    width: 250px;
    background-color: var(--background-reverse-color);
    border-width: 2px;
    overflow-y: auto;
  }

  .loaded-groups .label {
    position: fixed;
    top: 40px;
    height: 30px;
    width: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loaded-groups::-webkit-scrollbar {
    display: none; /* Chrome, Safari и Edge */
  }
  
  .list .row {
    position: relative;
    display: grid;
    grid-template-columns: 60px 1fr 25px;
    height: 25px;
    width: 100%;
    align-items: center;
    border-bottom-width: 1px;
    border-radius: 0px;
  }

  .list .row * {
    height: 25px;
    display: flex;
    align-items: center;
    border-radius: 0px;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    padding: 0px 5px 0px 5px;
  }

  .list .row *:hover {
    background-color: var(--button-hover-background-color);
  }
  .list .row *:active {
    background-color: var(--button-active-background-color);
  }

  .list .remove {
    justify-content: center;
    font-weight: bold;
  }
  .list .remove:hover {
    background-color: var(--button-hover-background-color);
  }
  .list .remove:active {
    background-color: var(--button-active-background-color);
  }
  
</style> 