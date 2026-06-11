<script>
  import { selectedSection, clearInformation, saveInformation, savedInformation, lng, message } from '../../lib/store.js'
  import FileInput from '../FileInput.svelte';

  let thisId = 'hours--summary-of-teachers';

  let _lng = {};
  lng.subscribe(value => (_lng = value));
  
  let this_;
  let uploadedFile = null;
  let data = null;

  $: if ($selectedSection) {
    if (this_) {
      if ($selectedSection === thisId) {
        this_.style.zIndex = '1';
      } else if (this_.style.zIndex !== '-1') {
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
  }

  async function saveAll() {
    if (uploadedFile === null) {
      message.set({type: 'error', text: 'summaryOfTeachers.notAllData'});
      return;
    }

    let endInformation = {
      ...data,
      id: thisId,
      filePath: uploadedFile.path
    };

    // Фінальне доповнення та комплектація перед відправкою до бекенду
    endInformation = await window.electron.hoursSummaryDataSupplement(endInformation);
    savedInformation.set(endInformation);
  }

  async function handleFileInputChange(detail) {
    // Перевірка на запуск у режимі vite-серверу без Electron
    if (!window.electron) return;

    uploadedFile = detail.file;
    data = await window.electron.hoursSummaryGetInformation(uploadedFile.path);

    if (!data) {
      message.set({type: 'error', text: 'inputFile.error'});
      clearInformation.set(thisId);
      return;
    }
  }

  function handleFileRemove(detail) {
    if (!window.electron) return;
    uploadedFile = null;
  }
</script>

<div class='gui' id={thisId} style:opacity={$selectedSection === thisId ? 1 : 0} bind:this={this_}>

  <FileInput eId='hours--summary-of-teachers--hours' extensions={['.xlsx']} type='excel'
    on:fileSelected={event => handleFileInputChange(event.detail)}
    on:fileRemoved={event => handleFileRemove(event.detail)}
  />

</div>

<style>
</style>