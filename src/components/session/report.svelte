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

  let thisId = "session--report";
  let _lng = {};
  lng.subscribe((value) => (_lng = value));

  let this_;
  let loadedGroups = [];

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

  $: if ($clearInformation) {
    if ($clearInformation === thisId) {
      clearAll();
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
      message.set({ type: "error", text: "report.notAllData" });
      return;
    }

    let endInformation = {
      id: thisId,
      filePath: loadedGroups[0].filePath,
      groups: loadedGroups,
    };

    // Final data supplementation before sending to the backend
    endInformation =
      await window.electron.sessionReportDataSupplement(endInformation);
    savedInformation.set(endInformation);
  }

  async function handleFileInputChange(detail) {
    // Check for running in vite-server mode without Electron
    if (!window.electron) return;

    if (detail.id === "session--report--statements") {
      const uploadedFile = detail.file;
      const data = await window.electron.sessionReportGetInformation(
        uploadedFile.path,
      );

      if (!data) {
        message.set({ type: "error", text: "inputFile.error" });
        clearInformation.set(thisId);
        return;
      }

      // Checking if this group has already been loaded
      for (const group of loadedGroups) {
        if (group.groupCode === data.groupCode) {
          message.set({
            type: "error",
            text: "report.groupAlreadyLoaded",
            params: { groupCode: group.groupCode },
          });
          return;
        }
      }

      // Adding a new group to the general list
      loadedGroups = [
        ...loadedGroups,
        { ...data, filePath: uploadedFile.path },
      ];
    }
  }

  async function handleFileRemove(detail) {
    return;
  }

  // Removing a group from the loaded list
  function handleRemoveRow(index) {
    loadedGroups.splice(index, 1);
    loadedGroups = [...loadedGroups];
    // Reassigning to trigger Svelte reactivity
  }
</script>

<div
  class="gui"
  id={thisId}
  style:opacity={$selectedSection === thisId ? 1 : 0}
  bind:this={this_}
>
  <FileInput
    eId="session--report--statements"
    extensions={[".xlsx"]}
    type="excel"
    on:fileSelected={(event) => handleFileInputChange(event.detail)}
    on:fileRemoved={(event) => handleFileRemove(event.detail)}
  />

  <div class="loaded-groups">
    <div class="label">{_lng.report.loadedGroups}</div>
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
  :global(.file-input#session--report--statements) {
    position: absolute;
  }
  :global(.file-input#session--report--statements .label) {
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
