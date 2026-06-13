<script>
  import {
    selectedSection,
    clearInformation,
    saveInformation,
    savedInformation,
    message,
    lng,
  } from "../../lib/store.js";
  import FileInput from "../FileInput.svelte";

  let thisId = "session--debtors";
  let _lng = {};
  lng.subscribe((value) => (_lng = value));

  let this_;
  let loadedGroups = [];

  $: if ($selectedSection) {
    if (this_) {
      if ($selectedSection === thisId) {
        this_.style.zIndex = "1";
      } else if (this_.style.zIndex !== "-1") {
        // The z-index delay is needed to wait for the CSS animation (opacity) to finish before hiding the element
        setTimeout(() => {
          this_.style.zIndex = -1;
        }, 200);
      }
    }
  }

  $: if ($clearInformation) {
    if ($clearInformation === thisId) {
      clearAll();
      // We clear the store with a delay to avoid race conditions in subscriptions
      setTimeout(() => {
        clearInformation.set(null);
      }, 50);
    }
  }

  $: if ($saveInformation) {
    if ($saveInformation === thisId) {
      saveAll();
      saveInformation.set(null);
    }
  }

  function clearAll() {
    loadedGroups = [];
  }

  async function saveAll() {
    if (loadedGroups.length === 0) {
      message.set({ type: "error", text: "debtors.notAllData" });
      return;
    }

    let endInformation = {
      id: thisId,
      filePath: loadedGroups[0].filePath,
      groups: loadedGroups,
    };
    // Interaction via IPC: sending the object to Electron to supplement data before final saving
    endInformation =
      await window.electron.sessionDebtorsDataSupplement(endInformation);
    savedInformation.set(endInformation);
  }

  async function handleFileInputChange(detail) {
    if (!window.electron) return;

    if (detail.id === "session--debtors--statements") {
      const uploadedFile = detail.file;
      // Interaction via IPC: parsing the loaded Excel file
      const data = await window.electron.sessionDebtorsGetInformation(
        uploadedFile.path,
      );

      if (!data) {
        message.set({ type: "error", text: "inputFile.error" });
        clearInformation.set(thisId);
        return;
      }

      // Checking to prevent duplication of already loaded groups
      for (const group of loadedGroups) {
        if (group.groupCode === data.groupCode) {
          message.set({
            type: "error",
            text: "debtors.groupAlreadyLoaded",
            params: { groupCode: group.groupCode },
          });
          return;
        }
      }

      loadedGroups = [
        ...loadedGroups,
        { ...data, filePath: uploadedFile.path },
      ];
    }
  }

  async function handleFileRemove(detail) {
    return;
  }

  function handleRemoveRow(index) {
    loadedGroups.splice(index, 1);
    // Reassigning the array via the spread operator is mandatory for Svelte reactivity to trigger
    loadedGroups = [...loadedGroups];
  }
</script>

<div
  class="gui"
  id={thisId}
  style:opacity={$selectedSection === thisId ? 1 : 0}
  bind:this={this_}
>
  <FileInput
    eId="session--debtors--statements"
    extensions={[".xlsx"]}
    type="excel"
    on:fileSelected={(event) => handleFileInputChange(event.detail)}
    on:fileRemoved={(event) => handleFileRemove(event.detail)}
  />

  <div class="loaded-groups">
    <div class="label">{_lng.debtors.loadedGroups}</div>
    <div class="list">
      {#each loadedGroups as group}
        <div class="row" id={group.groupCode}>
          <div class="groupCode">{group.groupCode}</div>
          <div class="specialityCodes">{group.specialityCodes.join(", ")}</div>
          <div
            class="remove"
            on:click={() => handleRemoveRow(loadedGroups.indexOf(group))}
          >
            ✕
          </div>
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

  /* Приховування стандартного скроллбару */
  .loaded-groups::-webkit-scrollbar {
    display: none;
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
    background-color: var(--button-hover-background-color1);
  }
  .list .row *:active {
    background-color: var(--button-active-background-color1);
  }

  .list .remove {
    justify-content: center;
    font-weight: bold;
  }
  .list .remove:hover {
    background-color: var(--button-hover-background-color1);
  }
  .list .remove:active {
    background-color: var(--button-active-background-color1);
  }
</style>
