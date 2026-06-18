<script>
  import {
    selectedSection,
    clearInformation,
    saveInformation,
    savedInformation,
    message,
    lng,
    textFilter,
  } from "../../lib/store.js";
  import FileInput from "../FileInput.svelte";
  import CustomDateInput from "../CustomDateInput.svelte";
  import { tick } from "svelte";

  let thisId = "hours--based-on-the-first-month";
  let _lng = {};
  lng.subscribe((value) => (_lng = value));

  // Array of standard hours: index 0 – for the 1st semester, index 1 – for the 2nd semester
  const hoursPerSubject = [
    {
      Біологія: 34,
      "Всесвітня історія": 34,
      Географія: 40,
      "Зарубіжна література": 34,
      "Захист України": 34,
      "Іноземна мова": 34,
      Інформатика: 34,
      "Історія України": 34,
      Математика: 68,
      "Українська література": 34,
      "Українська мова": 34,
      Фізика: 68,
      "Фізична культура": 51,
      Хімія: 34,
    },
    {
      Астрономія: 46,
      Біологія: 72,
      "Всесвітня історія": 46,
      Географія: 48,
      "Зарубіжна література": 46,
      "Захист України": 69,
      "Іноземна мова": 46,
      Інформатика: 23,
      "Історія України": 46,
      Математика: 69,
      "Українська література": 46,
      "Українська мова": 46,
      Фізика: 46,
      "Фізична культура": 69,
      Хімія: 54,
    },
  ];

  let this_;
  let uploadedFile = null;
  let data = { semesterEndDate: null };
  let subjectsAndHours = [];

  $: if ($selectedSection) {
    if (this_) {
      if ($selectedSection === thisId) {
        this_.style.zIndex = "1";
      } else if (this_.style.zIndex !== "-1") {
        // The delay is necessary so that the CSS disappearance animation (opacity) has time to finish
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
    uploadedFile = null;
    subjectsAndHours = [];
    data = { semesterEndDate: null };
  }

  async function saveAll() {
    if (
      uploadedFile === null ||
      data.semesterEndDate === null ||
      subjectsAndHours.length === 0 ||
      subjectsAndHours.some((item) => item.hours === "--")
    ) {
      message.set({ type: "error", text: "basedOnTheFirstMonth.notAllData" });
      return;
    }

    let endInformation = {
      ...data,
      id: thisId,
      filePath: uploadedFile.path,
      hoursPerSubject: subjectsAndHours,
    };

    // We receive the supplemented data via Electron API before final saving
    endInformation =
      await window.electron.hoursBasedDataSupplement(endInformation);
    savedInformation.set(endInformation);
  }

  async function handleFileInputChange(detail) {
    if (!window.electron) return;
    data = await window.electron.hoursBasedGetInformation(detail.file.path);

    if (!data) {
      message.set({ type: "error", text: "inputFile.error" });
      clearInformation.set(thisId);
      return;
    }

    uploadedFile = detail.file;

    const parts = data.semesterStartDate.split(".");
    const month = parseInt(parts[1], 10);
    // If the starting month is August or later (> 7) – it is the 1st semester, otherwise – the 2nd
    const semesterNumber = month > 7 ? 1 : 2;

    subjectsAndHours = [];
    const subjects = data.groups[0].subjects;
    const notFoundSubjects = [];

    for (const subject of subjects) {
      const hours = hoursPerSubject[semesterNumber - 1][subject.subjectName];
      if (hours) {
        subjectsAndHours.push({
          subjectName: subject.subjectName,
          hours: hours,
        });
      } else {
        subjectsAndHours.push({
          subjectName: subject.subjectName,
          hours: "--",
        });
        notFoundSubjects.push(subject.subjectName);
      }
    }

    if (notFoundSubjects.length > 0) {
      const notFoundSubjectsText = `  –  ${notFoundSubjects.join(";\n  –  ")}`;
      message.set({
        type: "warning",
        text: "basedOnTheFirstMonth.unfoundSubjects",
        params: { notFoundSubjects: notFoundSubjectsText },
      });
    }
  }

  function handleFileRemove(detail) {
    if (!window.electron) return;
    uploadedFile = null;
  }

  async function handleHoursInput(event, subjectIndex) {
    const input = event.target;
    const cursorStart = input.selectionStart;
    const originalValue = input.value;

    const cleanValue = textFilter(originalValue, { numbers: true });
    subjectsAndHours[subjectIndex].hours = cleanValue;
    input.value = cleanValue;

    // We calculate the new cursor position so that it does not "jump" to the end after filtering out invalid characters
    const diff = originalValue.length - cleanValue.length;
    const newCursorPos = cursorStart - diff;

    // We wait for the DOM to update before forcing the cursor to the correct place
    await tick();
    input.setSelectionRange(newCursorPos, newCursorPos);
  }
</script>

<div
  class="gui"
  id={thisId}
  style:opacity={$selectedSection === thisId ? 1 : 0}
  bind:this={this_}
>
  <FileInput
    eId={`${thisId}--hours`}
    extensions={[".xlsx"]}
    type="excel"
    on:fileSelected={(event) => handleFileInputChange(event.detail)}
    on:fileRemoved={(event) => handleFileRemove(event.detail)}
    isLoaded={uploadedFile !== null}
  />

  <div class="semester-end">
    <div>{_lng.basedOnTheFirstMonth.semesterEnd}</div>
    <CustomDateInput
      bind:value={data.semesterEndDate}
      class={uploadedFile === null ? "unavailable" : ""}
    />
  </div>

  <div class="hours-per-subject">
    <div class="label">{_lng.basedOnTheFirstMonth.hoursPerSubject}</div>
    <div class="list">
      {#each subjectsAndHours as subject, subjectIndex}
        <div class="row" id={subject.subjectName}>
          <div class="subject">{subject.subjectName}</div>
          <input
            class="hoursCount"
            value={subject.hours}
            on:input={(e) => handleHoursInput(e, subjectIndex)}
          />
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  :global(.file-input#hours--based-on-the-first-month--hours) {
    position: absolute;
  }
  :global(.file-input#hours--based-on-the-first-month--hours .label) {
    position: relative;
    width: calc(100% + 20px);
    left: -10px;
  }

  .semester-end {
    position: absolute;
    top: 240px;
    display: grid;
    grid-template-columns: 255px 25px;
    row-gap: 5px;
  }
  :global(#hours--based-on-the-first-month .semester-end input) {
    width: 90px;
    padding-left: 5px;
  }

  .hours-per-subject {
    position: absolute;
    top: 30px;
    left: 400px;
    height: 220px;
    width: 250px;
    background-color: var(--background-reverse-color);
    border-width: 2px;
    overflow-y: auto;
  }

  .hours-per-subject .label {
    position: fixed;
    top: 40px;
    height: 30px;
    width: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hours-per-subject::-webkit-scrollbar {
    display: none;
    display: none;
  }

  .list .row {
    position: relative;
    display: grid;
    grid-template-columns: 200px 1fr;
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
  }

  .list .subject {
    padding: 0px 5px 0px 5px;
  }
  .list .subject:hover {
    background-color: var(--button-hover-background-color1);
  }
  .list .subject:active {
    background-color: var(--button-active-background-color1);
  }

  .list .hoursCount {
    padding: 0px 5px 0px 5px;
    background-color: transparent;
    border-width: 0px;
  }
  .list .hoursCount:hover {
    background-color: var(--button-hover-background-color1);
  }
  .list .hoursCount:active {
    background-color: var(--button-active-background-color1);
  }
  .list .hoursCount:focus {
    background-color: transparent;
  }

  .list .row .subject,
  .list .row .hoursCount {
    overflow: hidden;
    white-space: nowrap;
  }
</style>
