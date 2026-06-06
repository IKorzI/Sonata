<script>
  import FileInput from '../FileInput.svelte';
  import { selectedSection, clearInformation, saveInformation, savedInformation, lng, message } from '../../lib/store.js'

  // ========== ЗАПОЛНИТЬ ==========
  let thisId = 'session--empty-statements';
  // ===============================

  let _lng = {};
  lng.subscribe(value => (_lng = value));

  let this_
  let uploadedFileHours = null;
  let uploadedFileContingent = null;
  let ePercentage;

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
    contingentData = null;
    hoursData = null;
    uploadedFileHours = null;
    uploadedFileContingent = null;
  }

  async function saveAll() {
    if (contingentData === null || hoursData === null || uploadedFileHours === null || uploadedFileContingent === null) {
      message.set({type: 'error', text: _lng.emptyStatements.notAllData});
      return;
    }
    
    const targetPath = await window.electron.saveDialog("Зберегти", ".txt");
    if (!targetPath) return;

    let endInformation = {
      id: thisId,
      filePath: targetPath,
      percentage: Number(ePercentage.value),
      hoursData: hoursData,
      contingentData: contingentData
    }

    console.log(endInformation)
    endInformation = await window.electron.sessionEmptyDataSupplement(endInformation);
    console.log(endInformation)

    savedInformation.set(endInformation);
  }

  let dddd = false
  async function handleFileInputChange(detail) {
    if (!window.electron) return;
    if (detail.id === 'session--empty-statements--hours') {
      uploadedFileHours = detail.file;
      hoursData = await window.electron.sessionEmptyGetInformation(uploadedFileHours.path, "hours");
      console.log(hoursData)
      if (!hoursData) {
        message.set({type: 'error', text: _lng.inputFile.error});
        uploadedFileHours = null;
        hoursData = null;
        clearInformation.set("session--empty-statements--hours")
        setTimeout(() => {
          clearInformation.set(null)
        }, 50)
        return;
      }
    } else if (detail.id === 'session--empty-statements--contingent') {
      uploadedFileContingent = detail.file;
      contingentData = await window.electron.sessionEmptyGetInformation(uploadedFileContingent.path, "contingent");
      console.log(contingentData)
      if (!contingentData) {
        message.set({type: 'error', text: _lng.inputFile.error});
        uploadedFileContingent = null;
        contingentData = null;
        clearInformation.set("session--empty-statements--contingent")
        setTimeout(() => {
          clearInformation.set(null)
        }, 50)
        dddd = true
        return;
      }
    }
  }

  function handleFileRemove(detail) {
    if (!window.electron) return;
    if (detail.id === 'session--empty-statements--hours') {
      uploadedFileHours = null;
      hoursData = null;
    } else if (detail.id === 'session--empty-statements--contingent') {
      uploadedFileContingent = null;
      contingentData = null;
    }
  }

</script>

<div class="gui" id={thisId} style:opacity={$selectedSection === thisId ? 1 : 0} bind:this={this_}>

  <FileInput eId='session--empty-statements--hours' extensions={['.xlsx']} type='excel'
    on:fileSelected={event => handleFileInputChange(event.detail)}
    on:fileRemoved={event => handleFileRemove(event.detail)}
  />

  <FileInput eId='session--empty-statements--contingent' extensions={['.xlsx']} type='excel'
    on:fileSelected={event => handleFileInputChange(event.detail)}
    on:fileRemoved={event => handleFileRemove(event.detail)}
  />

  <div class="percentage-of-scholarship">
    <div>{_lng.emptyStatements.percentage}</div>
    <input type="text" bind:this={ePercentage} value="40"/>
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
    grid-template-columns: 210px 25px;
    row-gap: 5px;
  }
  .percentage-of-scholarship input {
    width: 50px;
    text-align: center;
    padding-left: 0px;
  }

</style> 