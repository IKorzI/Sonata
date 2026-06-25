<script>
  import { onMount, onDestroy } from "svelte";
  import { whatDocumentWindow, lng } from "../lib/store.js";
  export let type;
  export let eId;

  let _lng = {};
  lng.subscribe((value) => (_lng = value));
  $: label = {
    "other--templates--statements": _lng?.fileOutput.label.statements,
    "other--templates--hours": _lng?.fileOutput.label.hours,
    "other--templates--contingent": _lng?.fileOutput.label.contingent,
  };

  $: names = {
    "other--templates--statements": {
      fileNameToSave: _lng?.fileOutput.names.statements,
      filePathToSave: "statements",
    },
    "other--templates--hours": {
      fileNameToSave: _lng?.fileOutput.names.hours,
      filePathToSave: "hours",
    },
    "other--templates--contingent": {
      fileNameToSave: _lng?.fileOutput.names.contingent,
      filePathToSave: "contingent",
    },
  };

  let eArea;
  $: backgroundImageUrl =
    type === "excel" ? "excel.png" : type === "word" ? "word.png" : "";

  async function handleDownload() {
    if (!window.electron) return;

    const baseName = names[eId].filePathToSave;
    const basePath = "examples/save/";

    // Accessing the Electron IPC bridge to find the actual file in the system
    const fileInfo = await window.electron.findFileWithExtension(
      basePath,
      baseName,
    );
    if (!fileInfo) {
      alert("File not found.");
      return;
    }

    const { fullPath, extension } = fileInfo;
    const fileName = names[eId].fileNameToSave;

    // Calling the native OS dialog to select the save location
    const targetPath = await window.electron.saveDialog(fileName, extension);
    if (!targetPath) return;

    const result = await window.electron.saveFile(fullPath, targetPath);
    if (!result.success) {
      alert("Error saving file: " + result.error);
    }
  }

  function handleWhat() {
    whatDocumentWindow.set(eId);
  }

  onMount(() => {
    let mouseCounter = 0;

    eArea.addEventListener("mouseenter", (e) => {
      mouseCounter++;
      eArea.classList.add("hovered");
    });

    eArea.addEventListener("mouseleave", (e) => {
      // A delay (10ms) and a counter prevent the hovered class from flickering when moving the cursor between child elements inside eArea
      setTimeout(() => {
        mouseCounter--;
        if (mouseCounter <= 0) {
          mouseCounter = 0;

          eArea.classList.remove("hovered");
        }
      }, 10);
    });
  });
  onDestroy(() => {
    eArea.removeEventListener("mouseenter");
    eArea.removeEventListener("mouseleave");
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

<div class="file-output" id={eId}>
  <div class="label">{label[eId]}</div>

  <div class="area" on:click={handleDownload} bind:this={eArea}>
    <div class="text">{_lng?.fileOutput.area.text}</div>
    <div
      class="img"
      style:background-image={`url(${backgroundImageUrl})`}
    ></div>
    <div class="what" on:click|stopPropagation={handleWhat}></div>
  </div>
</div>

<style>
  .area,
  .area * {
    cursor: pointer;
  }

  .file-output {
    position: relative;
    height: auto;
    width: 176px;
    display: grid;
    grid-template-rows: 40px 176px;
  }

  .area {
    position: relative;
    border-radius: 40px;
    border-style: dashed;
    border-width: 3px;
    display: flex;
    justify-content: center;
  }
  :global(.area.hovered) {
    background-color: var(--button-background-color);
  }

  .label {
    line-height: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .text {
    position: absolute;
    top: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .img {
    position: absolute;
    top: 60px;
    width: 60px;
    height: 60px;
    background-repeat: no-repeat;
    background-position: center;
    transition: 0.8s;
  }

  .what {
    position: absolute;
    top: 130px;
    width: 30px;
    height: 30px;
    background-image: var(--inputFile-what-background-image);
    border-radius: 999px;
  }
  .what:hover {
    background-color: var(--button-hover-background-color);
  }
  .what:active {
    background-color: var(--button-active-background-color);
  }
</style>
