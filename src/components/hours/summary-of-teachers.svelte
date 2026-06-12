<script>
  import { selectedSection, clearInformation, saveInformation, savedInformation, lng, message } from '../../lib/store.js'
  import FileInput from '../FileInput.svelte';

  let thisId = 'hours--summary-of-teachers';

  // Автоматичне оновлення мови програми
  let _lng = {};
  lng.subscribe(value => (_lng = value));
  
  let this_;
  let uploadedFile = null;
  let data = null;

  $: if ($selectedSection) {
    // Якщо компонент вже завантажено
    if (this_) {
      // Якщо ідентифікатор обраної сецкції, це ідентифікатор компоненту
      if ($selectedSection === thisId) {
        // зробити доступним для користувача
        this_.style.zIndex = '1';
      // Якщо ідентифікатор обраної сецкції, це не ідентифікатор компоненту
      } else if (this_.style.zIndex !== '-1') {
        // зробити недоступним для користувача з затримкою для виконання усіх анімацій
        setTimeout(() => {
          this_.style.zIndex = -1;
        }, 200);
      }
    }
  }

  $: if ($clearInformation) {
    // Якщо ідентифікатор очищення внесених даних, це ідентифікатор компоненту
    if ($clearInformation === thisId) {
      clearAll();
      setTimeout(() => {
        clearInformation.set(null);
      }, 50);
    }
  }

  $: if ($saveInformation) {
    // Якщо ідентифікатор збереження внесених даних, це ідентифікатор компоненту
    if ($saveInformation === thisId) {
      saveAll();
      saveInformation.set(null);
    }
  }
  
  // Очищення внесених даних
  function clearAll() {
    uploadedFile = null;
  }

  // Збереження внесених даних
  async function saveAll() {
    // Перевірка, чи все, що потрібно, внесено
    if (uploadedFile === null) {
      message.set({type: 'error', text: 'summaryOfTeachers.notAllData'});
      return;
    }

    // Збирання усієї внесеної інформації в одне ціле
    let endInformation = {
      ...data,
      id: thisId,
      filePath: uploadedFile.path
    };

    // Фінальне доповнення та комплектація перед відправкою до бекенду
    endInformation = await window.electron.hoursSummaryDataSupplement(endInformation);
    savedInformation.set(endInformation);
  }

  // Обробка завантаження файлу
  async function handleFileInputChange(detail) {
    // Перевірка на запуск у режимі vite-серверу без Electron
    if (!window.electron) return;

    data = await window.electron.hoursSummaryGetInformation(detail.file.path);

    if (!data) {
      message.set({type: 'error', text: 'inputFile.error'});
      clearInformation.set(thisId);
      return;
    }

    uploadedFile = detail.file;
  }

  // Обробка видалення файлу
  function handleFileRemove(detail) {
    // Якщо window не ініціалізована (додаток запущено у режимі vite-серверу без Electron) повернутися
    if (!window.electron) return;
    uploadedFile = null;
  }
</script>

<!-- Компонент -->
<div class='gui' id={thisId} style:opacity={$selectedSection === thisId ? 1 : 0} bind:this={this_}>

  <!-- Компонент FileInput для завантаження файлів -->
  <FileInput eId='hours--summary-of-teachers--hours' extensions={['.xlsx']} type='excel'
    on:fileSelected={event => handleFileInputChange(event.detail)}
    on:fileRemoved={event => handleFileRemove(event.detail)}
    isLoaded={uploadedFile !== null}
  />

</div>

<style>
</style>