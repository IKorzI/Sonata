<script>
  import FileInput from "../FileInput.svelte";
  import {
    selectedSection,
    clearInformation,
    saveInformation,
    savedInformation,
    lng,
    message,
    handleInput,
    settings,
  } from "../../lib/store.js";

  let thisId = "session--empty-statements";
  let _lng = {};
  lng.subscribe((value) => (_lng = value));

  let this_;
  let uploadedFileHours = null;
  let uploadedFileContingent = null;
  let ePercentage, eFirstIndex, eSemesterNumber;
  let percentageOfScholarship = "";
  let firstIndex = "";
  let semesterNumber = "";

  let contingentData = null;
  let hoursData = null;

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
    contingentData = null;
    hoursData = null;
    uploadedFileHours = null;
    uploadedFileContingent = null;
    percentageOfScholarship = "";
    firstIndex = "";
    semesterNumber = "";
  }

  async function saveAll() {
    if (
      percentageOfScholarship === "" ||
      firstIndex === "" ||
      semesterNumber === "" ||
      contingentData === null ||
      hoursData === null ||
      uploadedFileHours === null ||
      uploadedFileContingent === null
    ) {
      message.set({ type: "error", text: _lng?.emptyStatements.notAllData });
      return;
    }

    // Prompt the user for the path to save the final file
    const targetPath = await window.electron.saveDialog(_lng?.save, ".txt");
    if (!targetPath) return;

    let endInformation = {
      id: thisId,
      filePath: targetPath,
      percentage: Number(percentageOfScholarship),
      firstIndex: Number(firstIndex),
      semesterNumber: Number(semesterNumber),
      hoursData: hoursData,
      contingentData: contingentData,
      headName: $settings.headName,
    };

    // Final data supplementation before sending to the backend
    endInformation =
      await window.electron.sessionEmptyDataSupplement(endInformation);

    savedInformation.set(endInformation);
  }

  async function handleFileInputChange(detail) {
    // Check for running in vite-server mode without Electron
    if (!window.electron) return;

    if (detail.id === "session--empty-statements--hours") {
      const result = await window.electron.sessionEmptyGetInformation(
        detail.file.path,
        "hours",
      );

      if (result) {
        hoursData = result;
      } else {
        message.set({ type: "error", text: _lng?.inputFile.error });
        uploadedFileHours = null;
        hoursData = null;

        // Clearing the specific FileInput component in case of a file reading error
        clearInformation.set("session--empty-statements--hours");
        setTimeout(() => {
          clearInformation.set(null);
        }, 50);
        return;
      }

      uploadedFileHours = detail.file;
    } else if (detail.id === "session--empty-statements--contingent") {
      const result = await window.electron.sessionEmptyGetInformation(
        detail.file.path,
        "contingent",
      );

      if (result) {
        contingentData = result;
      } else {
        message.set({ type: "error", text: _lng?.inputFile.error });
        uploadedFileContingent = null;
        contingentData = null;

        // Clearing the specific FileInput component in case of a file reading error
        clearInformation.set("session--empty-statements--contingent");
        setTimeout(() => {
          clearInformation.set(null);
        }, 50);
        return;
      }

      uploadedFileContingent = detail.file;
    }
    if (uploadedFileHours !== null && uploadedFileContingent !== null) {
      percentageOfScholarship = $settings.percentage;
      firstIndex = 1;
      semesterNumber = contingentData.semesterNumber;
    }
  }

  function handleFileRemove(detail) {
    if (!window.electron) return;

    if (detail.id === "session--empty-statements--hours") {
      uploadedFileHours = null;
      hoursData = null;
    } else if (detail.id === "session--empty-statements--contingent") {
      uploadedFileContingent = null;
      contingentData = null;
    }
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
    isLoaded={uploadedFileHours !== null}
  />

  <FileInput
    eId={`${thisId}--contingent`}
    extensions={[".xlsx"]}
    type="excel"
    on:fileSelected={(event) => handleFileInputChange(event.detail)}
    on:fileRemoved={(event) => handleFileRemove(event.detail)}
    isLoaded={uploadedFileContingent !== null}
  />

  <div class="percentage-of-scholarship">
    <div>{_lng?.emptyStatements.percentage}</div>
    <input
      type="text"
      bind:this={ePercentage}
      bind:value={percentageOfScholarship}
      class:unavailable={uploadedFileHours === null ||
        uploadedFileContingent === null}
      on:input={(e) => handleInput(e.target, { numbers: true, maxNumber: 100 })}
    />
  </div>

  <div class="first-index">
    <div>{_lng?.emptyStatements.firstIndex}</div>
    <input
      type="text"
      bind:this={eFirstIndex}
      bind:value={firstIndex}
      class:unavailable={uploadedFileHours === null ||
        uploadedFileContingent === null}
      on:input={(e) => handleInput(e.target, { numbers: true })}
    />
  </div>

  <div class="semester-number">
    <div>{_lng?.emptyStatements.semesterNumber}</div>
    <input
      type="text"
      bind:this={eSemesterNumber}
      bind:value={semesterNumber}
      class:unavailable={uploadedFileHours === null ||
        uploadedFileContingent === null}
      on:input={(e) =>
        handleInput(e.target, { numbers: true, minNumber: 1, maxNumber: 2 })}
    />
  </div>
</div>

<style>
  :global(.file-input#session--empty-statements--hours) {
    position: absolute;
  }
  :global(.file-input#session--empty-statements--contingent) {
    position: absolute;
    left: 200px;
  }

  .percentage-of-scholarship {
    position: absolute;
    top: 250px;
    display: grid;
    grid-template-columns: 360px 25px;
    row-gap: 5px;
  }
  .percentage-of-scholarship input {
    width: 50px;
    text-align: center;
    padding-left: 0px;
  }
  .percentage-of-scholarship div {
    text-align: right;
    padding-right: 15px;
  }

  .first-index {
    position: absolute;
    top: 290px;
    display: grid;
    grid-template-columns: 360px 25px;
    row-gap: 5px;
  }
  .first-index input {
    width: 50px;
    text-align: center;
    padding-left: 0px;
  }
  .first-index div {
    text-align: right;
    padding-right: 15px;
  }

  .semester-number {
    position: absolute;
    top: 330px;
    display: grid;
    grid-template-columns: 360px 25px;
    row-gap: 5px;
  }
  .semester-number input {
    width: 50px;
    text-align: center;
    padding-left: 0px;
  }
  .semester-number div {
    text-align: right;
    padding-right: 15px;
  }
</style>
