<script>
  import { onMount, onDestroy } from "svelte";
  import {
    settingsWindow,
    settings,
    lng,
    changeLanguage,
    availableLngs,
    handleInput,
  } from "../lib/store.js";

  let _lng = {};
  lng.subscribe((value) => (_lng = value));

  $: headName = $settings?.headName;
  $: percentageOfScholarship = $settings?.percentage;
  $: semester1Start = $settings?.scholarshipSemester?.start2;
  $: semester1End = $settings?.scholarshipSemester?.end2;
  $: semester2Start = $settings?.scholarshipSemester?.start1;
  $: semester2End = $settings?.scholarshipSemester?.end1;

  let languageListIsOpen = false;

  function handleGlobalClick(event) {
    if (
      !event.target.className.includes("languageButton") &&
      event.target.tagName !== "LI" &&
      languageListIsOpen
    ) {
      const languageList = document.querySelector(
        ".settings-window .language-list",
      );
      languageList.style.opacity = "";
      languageList.style.zIndex = "";
      languageListIsOpen = false;
    }
  }

  onMount(() => {
    const languageList = document.querySelector(
      ".settings-window .language-list",
    );
    const keys = Object.keys(availableLngs);
    keys.forEach((lngCode, index) => {
      const li = document.createElement("li");
      li.textContent = availableLngs[lngCode];
      if (index === keys.length - 1) {
        li.className = "last";
      }
      li.id = lngCode;

      li.addEventListener("click", function (event) {
        changeLanguage(event.target.id);

        languageList.style.opacity = "";
        languageList.style.zIndex = "";
        languageListIsOpen = false;
      });

      languageList.appendChild(li);
    });

    window.addEventListener("click", handleGlobalClick);
  });

  onDestroy(() => {
    window.removeEventListener("click", handleGlobalClick);
  });

  function handlerClickSave() {
    window.electron.saveSetting("language", _lng?.lng);
    window.electron.saveSetting("headName", headName);
    window.electron.saveSetting("percentage", percentageOfScholarship);
    window.electron.saveSetting("scholarshipSemester.start1", semester2Start);
    window.electron.saveSetting("scholarshipSemester.end1", semester2End);
    window.electron.saveSetting("scholarshipSemester.start2", semester1Start);
    window.electron.saveSetting("scholarshipSemester.end2", semester1End);

    settingsWindow.set(false);
  }

  function handleClose() {
    settingsWindow.set(false);
  }

  function showLngList() {
    const languageList = document.querySelector(
      ".settings-window .language-list",
    );
    if (!languageListIsOpen) {
      languageList.style.zIndex = "999";
      languageList.style.opacity = "1";
      languageListIsOpen = true;
    } else {
      languageList.style.opacity = "";
      languageList.style.zIndex = "";
      languageListIsOpen = false;
    }
  }
</script>

<div class="settings-window" class:showed={$settingsWindow}>
  <div class="title">{_lng?.settingsWindow.title}</div>
  <button class="close" on:click={handleClose}>✕</button>
  <div class="text-area">
    <div class="language">
      <div>{_lng?.settingsWindow.language}</div>
      <button class="languageButton" on:click={showLngList}>{_lng?.name}</button
      >
      <ul class="language-list"></ul>
    </div>

    <div class="head-name">
      <div>{_lng?.settingsWindow.headName}</div>
      <input
        type="text"
        bind:value={headName}
        on:input={(e) => handleInput(e.target, { letters: true, spaces: true })}
      />
    </div>

    <div class="percentage-of-scholarship">
      <div>{_lng?.settingsWindow.percentage}</div>
      <input
        type="text"
        bind:value={percentageOfScholarship}
        on:input={(e) =>
          handleInput(e.target, { numbers: true, maxNumber: 100 })}
      />
    </div>

    <div class="data-block" id="semester1-dates">
      <div class="label">{_lng?.settingsWindow.semester1Dates.label}</div>
      <div class="row" id="start">
        <div>{_lng?.settingsWindow.semesterDates.start}</div>
        <input
          type="text"
          value={semester1Start}
          on:input={(e) =>
            handleInput(e.target, { letters: true, spaces: true })}
        />
      </div>
      <div class="row" id="end">
        <div>{_lng?.settingsWindow.semesterDates.end}</div>
        <input
          type="text"
          value={semester1End}
          on:input={(e) =>
            handleInput(e.target, { letters: true, spaces: true })}
        />
      </div>
    </div>

    <div class="data-block" id="semester2-dates">
      <div class="label">{_lng?.settingsWindow.semester2Dates.label}</div>
      <div class="row" id="start">
        <div>{_lng?.settingsWindow.semesterDates.start}</div>
        <input
          type="text"
          value={semester2Start}
          on:input={(e) =>
            handleInput(e.target, { letters: true, spaces: true })}
        />
      </div>
      <div class="row" id="end">
        <div>{_lng?.settingsWindow.semesterDates.end}</div>
        <input
          type="text"
          value={semester2End}
          on:input={(e) =>
            handleInput(e.target, { letters: true, spaces: true })}
        />
      </div>
    </div>
  </div>
  <button class="save" on:click={handlerClickSave}
    >{_lng?.settingsWindow.save}</button
  >
</div>

<style>
  .settings-window {
    grid-area: 1 / 1;
    height: 450px;
    width: 650px;
    background-color: var(--ErrorArea-window-background-color);
    overflow: hidden;
    position: relative;
    border-width: 2px;
    transform: translateY(+20px);
    display: grid;
    z-index: 1;
    opacity: 0;
    pointer-events: none;
    grid-template-rows: 30px 1fr 30px;
    transition: 0.4s;
  }
  .settings-window.showed {
    z-index: 2;
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0px);
  }

  .title {
    display: grid;
    text-align: center;
    align-items: center;
    font-size: 20px;
    font-weight: bold;
    border-bottom-width: 2px;
    border-radius: 0px;
  }

  .text-area {
    padding: 10px;
    overflow-y: auto;
    white-space: pre-wrap;
  }

  .close {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 28px;
    height: 28px;
    border-radius: 0px;
    border-top-right-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    background-color: transparent;
  }
  .close:hover {
    background-color: rgba(255, 59, 59, 0.9);
  }
  .close:active {
    background-color: rgba(255, 59, 59, 0.5);
  }

  .save {
    display: grid;
    text-align: center;
    align-items: center;
    font-size: 20px;
    border-radius: 0px;
    border-top-width: 2px;
    cursor: pointer;
  }

  .text-area::-webkit-scrollbar {
    width: 8px;
  }
  .text-area::-webkit-scrollbar-track {
    background: transparent;
  }
  .text-area::-webkit-scrollbar-thumb {
    background-color: rgb(153, 153, 153);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
  }

  .language {
    position: absolute;
    top: 40px;
    display: grid;
    grid-template-columns: 340px 140px;
    row-gap: 5px;
    font-weight: normal;
  }
  .language div {
    text-align: right;
    padding-right: 15px;
  }
  .language button {
    background-color: var(--input-background-color);
    width: calc(100% + 6px);
    text-align: left;
    border-width: 1px;
    border-radius: 3px;
    padding-left: 4px;
  }
  .language button:hover {
    background-color: var(--input-hover-background-color);
  }
  .language-list {
    position: absolute;
    height: 85px;
    width: calc(140px + 4px);
    top: 26px;
    left: 340px;
    opacity: 0;
    z-index: -1;
  }
  :global(.language-list li) {
    cursor: pointer;
  }

  .head-name {
    position: absolute;
    top: 80px;
    display: grid;
    grid-template-columns: 340px 240px;
    row-gap: 5px;
  }
  .head-name input {
    width: 100%;
    text-align: left;
  }
  .head-name div {
    text-align: right;
    padding-right: 15px;
  }

  .percentage-of-scholarship {
    position: absolute;
    top: 120px;
    display: grid;
    grid-template-columns: 340px 50px;
    row-gap: 5px;
  }
  .percentage-of-scholarship input {
    width: 100%;
    text-align: center;
    padding-left: 0px;
  }
  .percentage-of-scholarship div {
    text-align: right;
    padding-right: 15px;
  }

  .data-block {
    position: absolute;
    display: grid;
    grid-template-rows: 25px 25px 25px;
    row-gap: 15px;
  }
  .data-block .label {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .data-block .row {
    display: grid;
  }

  #semester1-dates .row,
  #semester2-dates .row {
    grid-template-columns: 160px 95px;
  }
  #semester1-dates {
    top: 160px;
  }
  #semester2-dates {
    top: 280px;
  }
</style>
