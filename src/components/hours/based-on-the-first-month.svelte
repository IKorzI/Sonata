<script>
  import { selectedSection, clearInformation, saveInformation, savedInformation, message, lng, textFilter, handleInput } from '../../lib/store.js'
  import FileInput from '../FileInput.svelte';
  import { tick } from 'svelte';
  
  // Ідентифікатор компоненту
  let thisId = 'hours--based-on-the-first-month';

  // Автоматичне оновлення мови програми
  let _lng = {};
  lng.subscribe(value => (_lng = value));

  // Години по предметах за 1-й та 2-й семестри
  const hoursPerSubject = [
    {
        'Біологія':               34,
        'Всесвітня історія':      34,
        'Географія':              40,
        'Зарубіжна література':   34,
        'Захист України':         34,
        'Іноземна мова':          34,
        'Інформатика':            34,
        'Історія України':        34,
        'Математика':             68,
        'Українська література':  34,
        'Українська мова':        34,
        'Фізика':                 68,
        'Фізична культура':       51,
        'Хімія':                  34
    },
    {
        'Астрономія':             46,
        'Біологія':               72,
        'Всесвітня історія':      46,
        'Географія':              48,
        'Зарубіжна література':   46,
        'Захист України':         69,
        'Іноземна мова':          46,
        'Інформатика':            23,
        'Історія України':        46,
        'Математика':             69,
        'Українська література':  46,
        'Українська мова':        46,
        'Фізика':                 46,
        'Фізична культура':       69,
        'Хімія':                  54
    },
  ];

  let this_                         // Даний компонент
  let uploadedFile = null;          // Завантажений файл
  let data = {semesterEnd: null};   // Отримана інформація (semesterEnd внесено для коректного відображення пустого значення на сторінці)
  let eSemesterEnd;                 // Елемент input для вводу кінця семестра
  let subjectsAndHours = [];        // Список елементів предмет-години, отриманих з файлу та відредаговані користувачем

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
    subjectsAndHours = [];
    data = {semesterEnd: null};
  }

  // Збереження внесених даних
  async function saveAll() {
    // Перевірка, чи все, що потрібно, внесено
    if (uploadedFile === null || eSemesterEnd.value === '' || subjectsAndHours.length === 0) {
      message.set({type: 'error', text: 'basedOnTheFirstMonth.notAllData'});
      return;
    }

    // Збирання усієї внесеної інформації в одне ціле
    let endInformation = {
      ...data,
      semesterEndDate: eSemesterEnd.value,
      id: thisId,
      filePath: uploadedFile.path,
      hoursPerSubject: subjectsAndHours
    }

    // Проходження даних через фінальне доповнення та комплектацію перед відправкою до бекенду
    endInformation = await window.electron.hoursBasedDataSupplement(endInformation);
    
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
    data = await window.electron.hoursBasedGetInformation(uploadedFile.path);

    // У разі помилки при отриманні інформації повертається false
    if (!data) {
      // Запис інформації про помилку для відображення користувачеві
      message.set({type: 'error', text: 'inputFile.error'});
      // Очищення внесеної інформації
      clearInformation.set(thisId)
      return;
    }

    // Отримання номера семестра
    const parts = data.semesterStartDate.split('.');
    const month = parseInt(parts[1], 10);
    const semesterNumber = month > 7 ? 1 : 2;

    // Отримання списку елементів предмет-години
    subjectsAndHours = [];
    const subjects = data.groups[0].subjects;
    const notFoundSubjects = []; // Премдети, які не були знайдені будуть відображені користувачеві в окні попередження
    for (const subject of subjects) {
      // Отримання годин зі словника
      const hours = hoursPerSubject[semesterNumber - 1][subject.subjectName];
      // Якщо такий предмет існує і години були знайдені
      if (hours) {
        subjectsAndHours.push({subjectName: subject.subjectName, hours: hours});
      // Якщо такий предмет не існує і години не були знайдені
      } else {
        subjectsAndHours.push({subjectName: subject.subjectName, hours: '--'});
        notFoundSubjects.push(subject.subjectName);
      }
    }
    
    // Якщо є хочаб 1 предмет, що не було знайдено у словнику – відобразити це користувачеві
    if (notFoundSubjects.length > 0) {
      // Формування тексту зі списку
      const notFoundSubjectsText = `  –  ${notFoundSubjects.join(';\n  –  ')}`;
      message.set({
        type: 'warning',                                    // Тип повідомлення
        text: 'basedOnTheFirstMonth.unfoundSubjects',       // Ключ зі словника перекладу
        params: { notFoundSubjects : notFoundSubjectsText } // Текст, що був сформований вище
      });
    }
  }

  // Обробка видалення файлу
  function handleFileRemove(detail) {
    // Якщо window не ініціалізована (додаток запущено у режимі vite-серверу без Electron) повернутися
    if (!window.electron) return;
    // Видалення запису про файл
    uploadedFile = null;
  }

  // Обробка введення годин
  async function handleHoursInput(event, subjectIndex) {
    // Отримання елементу input
    const input = event.target;
    // Запис поточної позиції курсору, яку поставив браузер після введення
    const cursorStart = input.selectionStart;
    const originalValue = input.value;
    // Очистка значення (видалення всього крім цифр)
    const cleanValue = textFilter(originalValue, { numbers: true });
    // Оновлення тексту
    subjectsAndHours[subjectIndex].hours = cleanValue;
    input.value = cleanValue;
    // Обчислення зміщення курсору
    const diff = originalValue.length - cleanValue.length;
    const newCursorPos = cursorStart - diff;
    // Очікування Svelte
    await tick();
    // Встановлення курсору на правильну позицію
    input.setSelectionRange(newCursorPos, newCursorPos);
  }
</script>

<!-- Компонент -->
<div class='gui' id={thisId} style:opacity={$selectedSection === thisId ? 1 : 0} bind:this={this_}>

  <!-- Компонент FileInput для завантаження файлів -->
  <FileInput eId='hours--based-on-the-first-month--hours' extensions={['.xlsx']} type='excel'
    on:fileSelected={event => handleFileInputChange(event.detail)}
    on:fileRemoved={event => handleFileRemove(event.detail)}
  />

  <!-- Блок FileInput для завантаження файлів -->
  <div class='semester-end'>
    <div>{_lng.basedOnTheFirstMonth.semesterEnd}</div>
    <input type='text' bind:this={eSemesterEnd} value='{data.semesterEndDate ? `${data.semesterEndDate}`: ''}' class:unavailable={uploadedFile === null} on:input={(e) => handleInput(e.target, { numbers: true, period: true })}/>
  </div>

  <!-- Таблиця елементів предмет-години -->
  <div class='hours-per-subject'>
    <div class='label'>{_lng.basedOnTheFirstMonth.hoursPerSubject}</div>
    <div class='list'>
      <!-- Автоматичне створення елементів відносно списку subjectsAndHours -->
      {#each subjectsAndHours as subject, subjectIndex}
        <div class='row' id={subject.subjectName}>
          <div class='subject'>{subject.subjectName}</div>
          <input class='hoursCount' value={subject.hours} on:input={(e) => handleHoursInput(e, subjectIndex)}/>
        </div>
      {/each}
    </div>
  </div>

</div>

<style>

  /* Індивідуальні стилі для компоненту FileInput */
  :global(.file-input#hours--based-on-the-first-month--hours) {
    position: absolute;
  }
  :global(.file-input#hours--based-on-the-first-month--hours .label) {
    position: relative;
    width: calc(100% + 20px);
    left: -10px;
  }

  /* Інші стилі */
  .semester-end {
    position: absolute;
    top: 240px;
    display: grid;
    grid-template-columns: 255px 25px;
    row-gap: 5px;
  }
  .semester-end input {
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