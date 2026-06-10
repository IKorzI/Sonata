<script>
  import { selectedSection, clearInformation, saveInformation, savedInformation, lng, message } from '../../lib/store.js'
  import FileInput from '../FileInput.svelte';

  // Ідентифікатор компоненту
  let thisId = 'hours--summary-of-teachers';

  // Автоматичне оновлення мови програми
  let _lng = {};
  lng.subscribe(value => (_lng = value));
  
  let this_                 // Даний компонент
  let uploadedFile = null;  // Завантажений файл
  let data = null           // Отримана інформація

  // Підписання на:
  //   – відображення компоненту
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
  //   – очищення внесених даних
  $: if ($clearInformation) {
    // Якщо ідентифікатор очищення внесених даних, це ідентифікатор компоненту
    if ($clearInformation === thisId) {
      // Очистити усі дані
      clearAll()
      // Очистити ідентифікатор очищення внесених даних з затримкою, щоб компонент FileInput теж встиг очиститися
      setTimeout(() => {
        clearInformation.set(null)
      }, 50)
    }
  }
  //   – збереження внесених даних для подальшої роботи з ними
  $: if ($saveInformation) {
    // Якщо ідентифікатор збереження внесених даних, це ідентифікатор компоненту
    if ($saveInformation === thisId) {
      // Зберегти усі дані
      saveAll()
      // Очистити ідентифікатор збереження внесених даних
      saveInformation.set(null)
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
    }

    // Проходження даних через фінальне доповнення та комплектацію перед відправкою до бекенду
    endInformation = await window.electron.hoursSummaryDataSupplement(endInformation);

    // Запис фінальних даних
    savedInformation.set(endInformation);
  }

  // Обробка завантаження файлу
  async function handleFileInputChange(detail) {
    // Якщо window не ініціалізована (додаток запущено у режимі vite-серверу без Electron) повернутися
    if (!window.electron) return;

    // Запис отриманого файлу
    uploadedFile = detail.file;
    // Отримання інформації з файлу
    data = await window.electron.hoursSummaryGetInformation(uploadedFile.path);

    // У разі помилки при отриманні інформації повертається false
    if (!data) {
      // Запис інформації про помилку для відображення користувачеві
      message.set({type: 'error', text: 'inputFile.error'});
      // Очищення внесеної інформації
      clearInformation.set(thisId)
      return;
    }
  }

  // Обробка видалення файлу
  function handleFileRemove(detail) {
    // Якщо window не ініціалізована (додаток запущено у режимі vite-серверу без Electron) повернутися
    if (!window.electron) return;
    // Видалення запису про файл
    uploadedFile = null;
  }
</script>

<!-- Компонент -->
<div class='gui' id={thisId} style:opacity={$selectedSection === thisId ? 1 : 0} bind:this={this_}>

  <!-- Компонент FileInput для завантаження файлів -->
  <FileInput eId='hours--summary-of-teachers--hours' extensions={['.xlsx']} type='excel'
    on:fileSelected={event => handleFileInputChange(event.detail)}
    on:fileRemoved={event => handleFileRemove(event.detail)}
  />

</div>

<style>
  
  /* Стилів немає, бо компонент простий */
  
</style> 