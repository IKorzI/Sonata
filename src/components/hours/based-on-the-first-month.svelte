<script>
  import { selectedSection, clearInformation, saveInformation, savedInformation, message } from '../../lib/store.js'
  import FileInput from '../FileInput.svelte';
  import { tick } from 'svelte';

  // ========== ЗАПОЛНИТЬ ==========
  let thisId = 'hours--based-on-the-first-month';
  // ===============================

  const hoursPerSubject = [
    {
        "Біологія":               34,
        "Всесвітня історія":      34,
        "Географія":              40,
        "Зарубіжна література":   34,
        "Захист України":         34,
        "Іноземна мова":          34,
        "Інформатика":            34,
        "Історія України":        34,
        "Математика":             68,
        "Українська література":  34,
        "Українська мова":        34,
        "Фізика":                 68,
        "Фізична культура":       51,
        "Хімія":                  34
    },
    {
        "Астрономія":             46,
        "Біологія":               72,
        "Всесвітня історія":      46,
        "Географія":              48,
        "Зарубіжна література":   46,
        "Захист України":         69,
        "Іноземна мова":          46,
        "Інформатика":            23,
        "Історія України":        46,
        "Математика":             69,
        "Українська література":  46,
        "Українська мова":        46,
        "Фізика":                 46,
        "Фізична культура":       69,
        "Хімія":                  54
    },
  ];

  let this_
  let uploadedFile = null;
  let data = {semesterEnd: null};
  let eSemesterEnd;
  let subjectsAndHours = [];

  $: if ($selectedSection) {
    if (this_) {
      if ($selectedSection === thisId) {
        this_.style.zIndex = null;
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
    uploadedFile = null;
    subjectsAndHours = [];
    data = {semesterEnd: null};
  }

  async function saveAll() {
    const semesterEndDate = eSemesterEnd.value

    let endInformation = {
      ...data,
      semesterEndDate: semesterEndDate,
      id: thisId,
      filePath: uploadedFile.path,
      hoursPerSubject: subjectsAndHours
    }
    console.log(endInformation)
    endInformation = await window.electron.hoursBasedDataSupplement(endInformation);
    console.log(endInformation)
    savedInformation.set(endInformation);
  }

  async function handleFileInputChange(detail) {
    if (!window.electron) return;
    if (detail.id === 'hours--based-on-the-first-month--hours') {
      uploadedFile = detail.file;
      data = await window.electron.hoursBasedGetInformation(uploadedFile.path);
      console.log(data);
      const parts = data.semesterStartDate.split(".");
      const month = parseInt(parts[1], 10);
      let semesterNumber;
      if (month > 7) {
        semesterNumber = 1;
      } else {
        semesterNumber = 2;
      }
      subjectsAndHours = [];
      const subjects = data.groups[0].subjects;
      const notFoundSubjects = [];
      for (const subject of subjects) {
        const hours = hoursPerSubject[semesterNumber - 1][subject.subjectName];
        if (hours !== undefined) {
          subjectsAndHours.push({subjectName: subject.subjectName, hours: hours});
        } else {
          subjectsAndHours.push({subjectName: subject.subjectName, hours: "--"});
          notFoundSubjects.push(subject.subjectName);
        }
      }
      
      if (notFoundSubjects.length > 0) {
        const messageText = `У нормах годин не були знайдені наступні предмети і вони потребують особистого заповнення:\n${notFoundSubjects.join(', ')}`;
        message.set({type: 'warning', text: messageText});
      }
    }
  }

  function handleFileRemove(detail) {
    if (!window.electron) return;
    if (detail.id === 'hours--based-on-the-first-month--hours') {
      uploadedFile = null;
    }
  }

  async function handleInput(event, subjectIndex) {
    const input = event.target;
    
    // 1. Запоминаем текущую позицию курсора (которую поставил браузер после ввода)
    const cursorStart = input.selectionStart;
    const originalValue = input.value;

    // 2. Чистим значение (удаляем всё кроме цифр)
    const cleanValue = originalValue.replace(/[^0-9]/g, '');

    // 3. Обновляем данные
    subjectsAndHours[subjectIndex].hours = cleanValue;
    input.value = cleanValue; // Обновляем визуально сразу

    // Вычисляем смещение курсора.
    // Если мы удалили символ (например, букву), длина уменьшилась.
    // Нам нужно вернуть курсор назад на количество удаленных символов.
    const diff = originalValue.length - cleanValue.length;
    const newCursorPos = cursorStart - diff;

    // 4. Ждем, пока Svelte закончит свои дела с DOM
    await tick();

    // 5. Восстанавливаем курсор на правильную позицию
    input.setSelectionRange(newCursorPos, newCursorPos);
  }
</script>

<div class="gui" id={thisId} style:opacity={$selectedSection === thisId ? 1 : 0} bind:this={this_}>

  <FileInput eId='hours--based-on-the-first-month--hours' extensions={['.xlsx']} type='excel'
    on:fileSelected={event => handleFileInputChange(event.detail)}
    on:fileRemoved={event => handleFileRemove(event.detail)}
  />

  <div class="semester-end">
    <div>Крайня дата навчання у семестрі</div>
    <input type="text" bind:this={eSemesterEnd} value="{data.semesterEndDate ? `${data.semesterEndDate}`: ""}" class:unavailable={uploadedFile === null}/>
  </div>

  <div class="hours-per-subject">
    <div class="label">Години по предметах</div>
    <div class="list">
      {#each subjectsAndHours as subject, subjectIndex}
        <div class="row" id={subject.subjectName}>
          <div class="subject">{subject.subjectName}</div>
          <input class="hoursCount" value={subject.hours} on:input={(e) => handleInput(e, subjectIndex)}/>
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
    display: none; /* Chrome, Safari и Edge */
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
    background-color: var(--button-hover-background-color);
  }
  .list .subject:active {
    background-color: var(--button-active-background-color);
  }

  .list .hoursCount {
    padding: 0px 5px 0px 5px;
    background-color: transparent;
    border-width: 0px;
  }
  .list .hoursCount:hover {
    background-color: var(--button-hover-background-color);
  }
  .list .hoursCount:active {
    background-color: var(--button-active-background-color);
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