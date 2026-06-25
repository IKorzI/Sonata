<script>
  import {
    selectedSection,
    clearInformation,
    saveInformation,
    savedInformation,
    message,
    whatDocumentWindow,
    lng,
  } from "../lib/store.js";
  import { tick } from "svelte";
  import SessionPackageOfDocuments from "./session/package-of-documents.svelte";
  import SessionEmptyStatements from "./session/empty-statements.svelte";
  import SessionReport from "./session/report.svelte";
  import SessionDebtors from "./session/debtors.svelte";

  import HoursBasedOnTheFirstMonth from "./hours/based-on-the-first-month.svelte";
  import HoursSummaryOfTeachers from "./hours/summary-of-teachers.svelte";

  import OtherTemplates from "./other/templates.svelte";
  import OtherOther from "./other/other.svelte";

  let _lng = {};
  lng.subscribe((value) => (_lng = value));

  $: if ($savedInformation) {
    // Reactive trigger: when data is collected and saved to the store (after clicking "Start"), we automatically start processing
    start();
  }

  let isProcessing = false;
  let isComleting = false;
  let isDone = true;
  let elComplete;
  const startSections = [
    "session--empty-statements",
    "session--package-of-documents",
    "session--report",
    "session--debtors",
    "hours--based-on-the-first-month",
    "hours--summary-of-teachers",
  ];
  $: isVisible = startSections.includes($selectedSection);
  function completeAnimation() {
    if (isDone) {
      elComplete.style.transition = "clip-path 0s";
      elComplete.style.clipPath = "inset(0 100% 0 0)";

      setTimeout(() => {
        elComplete.style.transition = "clip-path 0.4s ease-in-out";
        elComplete.style.zIndex = "1";
        elComplete.style.display = "block";
        setTimeout(() => {
          elComplete.style.clipPath = "inset(0 0 0 0)";
        }, 50);
      }, 50);
      setTimeout(() => {
        elComplete.style.zIndex = "";
        elComplete.style.display = "";
        elComplete.style.transition = "";

        isComleting = false;
      }, 3100);
    } else {
      elComplete.style.transition = "transform 0s";
      elComplete.style.transformOrigin = "center";
      elComplete.style.transform = "scale(0.2)";
      elComplete.style.display = "block";
      elComplete.style.zIndex = "1";
      elComplete.style.opacity = "0";
      setTimeout(() => {
        elComplete.style.transition =
          "transform 0.4s ease-in-out, opacity 0.2s ease";
        elComplete.style.opacity = "1";
        elComplete.style.transform = "scale(1)";
      }, 50);
      setTimeout(() => {
        elComplete.style.transformOrigin = "";
        elComplete.style.transition = "";
        elComplete.style.transform = "";
        elComplete.style.zIndex = "";
        elComplete.style.display = "";
        elComplete.style.opacity = "";
        elComplete.style.transition = "";

        isComleting = false;
      }, 3050);
    }
  }

  async function start() {
    if (isProcessing || $savedInformation?.id === undefined) return;
    isProcessing = true;
    isDone = true;

    try {
      // Sending the collected data to the Python server via Electron's IPC bridge
      let backendResponse =
        await window.electron.startBackendFunc($savedInformation);
      if (backendResponse.error) {
        const errorText = `Error: ${backendResponse.error}\n\nTracing:\n${backendResponse.traceback}`;
        message.set({
          type: "error",
          text: errorText,
        });
        isDone = false;
        return;
      }

      let result = backendResponse.result || backendResponse;
      if (
        result.success === true &&
        (result.files?.length > 0 || result.customText)
      ) {
        let messageFromTheBackendData = {};
        // Creating an object to display the list of generated files or warnings in a modal window
        if (result.files?.length > 0) {
          const filesText = `  –  ${result.files.join(";\n  –  ")}`;
          messageFromTheBackendData.filesText = filesText;
        }

        if (result.customText) {
          messageFromTheBackendData.customText = result.customText;
        }

        message.set({
          type: "warning",
          text: "",
          params: { messageFromTheBackendData: messageFromTheBackendData },
        });
      } else if (
        result.success === true &&
        result.notFoundSubjects?.length > 0
      ) {
        let notFoundSubjectsText = "";
        result.notFoundSubjects.forEach((group) => {
          notFoundSubjectsText += `\n  – ${group.group}: ${group.subjects.join(", ")}`;
        });
        message.set({
          type: "warning",
          text: "workspace.unfoundSubjects",
          params: { notFoundSubjects: notFoundSubjectsText },
        });
      }
    } catch (err) {
      message.set({
        type: "error",
        text: `System error JS: ${err.message}`,
      });
      isDone = false;
    } finally {
      isComleting = true;
      isProcessing = false;
      await tick();
      completeAnimation();
    }
  }

  function example() {
    whatDocumentWindow.set($selectedSection);
  }

  function clear() {
    clearInformation.set($selectedSection);
  }

  async function save() {
    if (!window.electron) return;
    saveInformation.set($selectedSection);
  }
</script>

<div class="workspace">
  <button class="example" class:hidden={!isVisible} on:click={() => example()}
    >{_lng?.workspace.example}</button
  >
  <button class="clear" class:hidden={!isVisible} on:click={() => clear()}
    >{_lng?.workspace.clear}</button
  >
  <button class="start" class:hidden={!isVisible} on:click={() => save()}>
    {#if isProcessing === false && isComleting === false}
      {_lng?.workspace.start}
    {/if}
    <div
      class="process"
      style="
      z-index: {isProcessing === true ? '1' : '-1'};
      display: {isProcessing === true ? 'block' : 'none'};
    "
    ></div>
    <div
      class="complete"
      bind:this={elComplete}
      style="background-image: {isDone === true
        ? "url('./done.png')"
        : "url('./undone.png')"};"
    ></div>
  </button>

  <SessionPackageOfDocuments />
  <SessionEmptyStatements />
  <SessionReport />
  <SessionDebtors />

  <HoursBasedOnTheFirstMonth />
  <HoursSummaryOfTeachers />

  <OtherTemplates />
  <OtherOther />
</div>

<style>
  .workspace {
    position: absolute;
    bottom: 15px;
    right: 10px;
    height: calc(100% - 57px);
    width: calc(100% - 240px);
    opacity: 1;
  }

  button {
    position: absolute;
    bottom: 20px;
    height: 40px;
    width: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-width: 2px;
  }

  .example {
    width: 340px;
    right: 260px;
    z-index: 2;
  }
  .clear {
    right: 140px;
    z-index: 2;
  }
  .start {
    right: 20px;
    z-index: 2;
  }

  .process {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 25px;
    width: 25px;
    background-image: var(--startProcess-background-image);
    z-index: -1;
    display: none;
    animation: spin 2s linear infinite;
  }

  .complete {
    position: absolute;
    /* top: 50%;
    left: 50%;
    transform: translate(-50%, -50%); */
    height: 25px;
    width: 25px;
    z-index: -1;
    display: none;
  }

  @keyframes spin {
    from {
      transform: translate(-50%, -50%) rotate(360deg);
    }
    to {
      transform: translate(-50%, -50%) rotate(0deg);
    }
  }

  .hidden {
    display: none;
    z-index: -1;
  }
</style>
