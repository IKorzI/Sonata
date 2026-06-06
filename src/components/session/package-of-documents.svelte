<script>
  import { onMount, onDestroy } from 'svelte';
  import FileInput from '../FileInput.svelte';
  import { selectedSection, clearInformation, saveInformation, savedInformation, lng, message } from '../../lib/store.js'

  // ========== ЗАПОЛНИТЬ ==========
  let thisId = 'session--package-of-documents';
  // ===============================

  let _lng = {};
  lng.subscribe(value => (_lng = value));

  $: statusesList = _lng.packageOfDocuments.socialScholarship.statusesList;

  let data = {subgroups: [], kuratorNom: null, kuratorGen: null, percentage: null, semesterStart: null, semesterEnd: null};
  let studentNamesByCode = {};
  let socialyList = [];
  let increasedList = [];
  let list = [];
  let currentList = 'socialy';
  let uploadedFile = null;

  let this_
  let eList, eStudentsBySpecialty, eStatusList, ePercentage, eSemesterStart, eSemesterEnd, eKuratorNom, eKuratorGen;
  let currentStudentRow;
  let studentListMoveProcessing = false;
  let statusListMoveProcessing = false;
  let showedStudentList = false;
  let showedStatusList = false;

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
    data = {subgroups: [], kuratorNom: null, kuratorGen: null, percentage: null, semesterStart: null, semesterEnd: null};
    increasedList = [];
    socialyList = [];
    list = [];
    uploadedFile = null;
    eKuratorGen.value = '';
  }

  async function saveAll() {
    if (
      data.subgroups.length === 0 ||
      data.percentage === null ||
      uploadedFile === null ||
      eKuratorNom.value === '' ||
      eKuratorGen.value === '' ||
      eSemesterStart.value === '' ||
      eSemesterEnd.value === ''
    ) {
      message.set({type: 'error', text: _lng.packageOfDocuments.notAllData});
      return;
    }

    if (currentList === 'socialy') {
      socialyList = list;
    } else if (currentList === 'increased') {
      increasedList = list;
    }

    let endInformation = {
      ...data,
      id: thisId,
      filePath: uploadedFile.path,
      socialyList: socialyList,
      increasedList: increasedList,
      kuratorNom: eKuratorNom.value,
      kuratorGen: eKuratorGen.value,
      semesterStart: eSemesterStart.value,
      semesterEnd: eSemesterEnd.value
    }

    console.log(endInformation)
    endInformation = await window.electron.sessionPackageDataSupplement(endInformation);
    console.log(endInformation)

    savedInformation.set(endInformation);
  }

  function stylesLoadedSet(type, value, top = null, left = null) {
    if (type === 'student' && !studentListMoveProcessing) {
      studentListMoveProcessing = true;

      if (value) {
        if (!eStudentsBySpecialty.classList.contains('showed')) {
          eStudentsBySpecialty.style.top = top;
          eStudentsBySpecialty.style.left = left;
          eStudentsBySpecialty.style.zIndex = '1';
          setTimeout(() => {
            eStudentsBySpecialty.style.transition = '0.2s';
            eStudentsBySpecialty.classList.add('showed');
          }, 10);
        } else {
          eStudentsBySpecialty.style.transition = '0.4s';
          eStudentsBySpecialty.style.top = top;
          eStudentsBySpecialty.style.left = left;
        };
        setTimeout(() => {
          eStudentsBySpecialty.style.transition = null;
          studentListMoveProcessing = false;
        }, 400);
        stylesLoadedSet('status', false);
        showedStudentList = true

      } else {
        if (!eStudentsBySpecialty.classList.contains('showed')) {
          studentListMoveProcessing = false;
          return;
        }
        eStudentsBySpecialty.style.transition = '0.2s';
        eStudentsBySpecialty.classList.remove('showed');
        setTimeout(() => {
          eStudentsBySpecialty.style.transition = null;
          setTimeout(() => {
            eStudentsBySpecialty.style.zIndex = '-1';
          }, 10);
          studentListMoveProcessing = false;
        }, 400);
        showedStudentList = false
      }

    } else if (type === 'status' && !statusListMoveProcessing) {
      statusListMoveProcessing = true;
      if (value) {
        if (!eStatusList.classList.contains('showed')) {
          eStatusList.style.top = top;
          eStatusList.style.left = left;
          eStatusList.style.zIndex = '1';
          setTimeout(() => {
            eStatusList.style.transition = '0.2s';
            eStatusList.classList.add('showed');
          }, 10);
        } else {
          eStatusList.style.transition = '0.4s';
          eStatusList.style.top = top;
          eStatusList.style.left = left;
        };
        setTimeout(() => {
          eStatusList.style.transition = null;
          statusListMoveProcessing = false;
        }, 400);
        stylesLoadedSet('student', false);
        showedStatusList = true

      } else {
        if (!eStatusList.classList.contains('showed')) {
          statusListMoveProcessing = false;
          return;
        }
        eStatusList.style.transition = '0.2s';
        eStatusList.classList.remove('showed');
        setTimeout(() => {
          eStatusList.style.transition = null;
          setTimeout(() => {
            eStatusList.style.zIndex = '-1';
          }, 10);
          statusListMoveProcessing = false;
        }, 400);
        showedStatusList = false
      }
    }
  }
  
  async function handleFileInputChange(detail) {
    if (!window.electron) return;
    if (detail.id === 'session--package-of-documents--statements') {
      uploadedFile = detail.file;
      data = await window.electron.sessionPackageGetInformation(uploadedFile.path);
      console.log(data)
      if (!data) {
        message.set({type: 'error', text: _lng.inputFile.error});
        clearInformation.set(thisId)
        return;
      }

      // Получение списка имён студентов по коду специальности
      studentNamesByCode = data.subgroups.reduce((acc, specialty, index) => {
        acc[specialty.specialityCode] = {
          specialityIndex: index,
          students: specialty.students.map(s => s.studentName)
        };
        return acc;
      }, {});
    }
    console.log(data);
  }

  function handleFileRemove(detail) {
    if (!window.electron) return;
    if (detail.id === 'session--package-of-documents--statements') {
      clearAll();
    }
  }

  function handleAddRow() {
    if (currentList === 'socialy') {
      list.push({ studentName: null, studentIndex: null, specialityIndex: null, status: null });
    }
    else if (currentList === 'increased') {
      list.push({ studentName: null, studentIndex: null, specialityIndex: null });
    }
    list = [...list]; // создаём новый массив для реактивности
  }

  function handleRemoveRow(index) {
    list.splice(index, 1);
    list = [...list];
  }

  function handleOpenStudentsList(index) {
    if (!showedStudentList || currentStudentRow !== index) {
      currentStudentRow = index;
      const element = document.querySelector('#row-' + index);
      const rect = element.getBoundingClientRect();
      const top = `${rect.top + element.offsetHeight}px`;
      const left = `${rect.left + 25}px`;
      stylesLoadedSet('student', true, top, left);
    } else {
      currentStudentRow = null;
      stylesLoadedSet('student', false);
    }
  }

  function handleOpenStatusesList(index) {
    const row = document.getElementById(`row-${index}`);
    const status = row.querySelector(".status");
    if (!status.hasAttribute("readonly")) {
      return;
    }
    if (!showedStatusList || currentStudentRow !== index) {
      currentStudentRow = index;
      const element = document.querySelector('#row-' + index);
      const rect = element.getBoundingClientRect();
      const top = `${rect.top + element.offsetHeight}px`;
      const left = `${rect.left + 25 + 285}px`;
      stylesLoadedSet('status', true, top, left);
    } else {
      currentStudentRow = null;
      stylesLoadedSet('status', false);
    }
  }

  function handleSetStudent(studentName, studentIndex, specialityIndex) {
    if (currentStudentRow !== null) {
      list[currentStudentRow].studentName = studentName;
      list[currentStudentRow].studentIndex = studentIndex;
      list[currentStudentRow].specialityIndex = specialityIndex;
      list = [...list];
      currentStudentRow = null;
      stylesLoadedSet('student', false);
    }
  }

  function handleSetStatus(status) {
    if (currentStudentRow !== null) {
      list[currentStudentRow].status = status;
      list = [...list];
      currentStudentRow = null;
      stylesLoadedSet('status', false);
    }
  }

  function handleGlobalClick(event) {
    const target = event.target;
    if (target.classList[0] === 'student' || target.classList[0] === 'status') return;

    if (currentStudentRow !== null) {
      if (showedStudentList) {
        currentStudentRow = null;
        stylesLoadedSet('student', false);
      } else if (showedStatusList) {
        currentStudentRow = null;
        stylesLoadedSet('status', false);
      }
    }
  }

  function handleStatusEnter(index) {
    const row = document.getElementById(`row-${index}`);
    const editStatus = row.querySelector(".edit-status");
    editStatus.style.display = "block";
  }
  function handleStatusLeave(index) {
    const row = document.getElementById(`row-${index}`);
    const editStatus = row.querySelector(".edit-status");
    editStatus.style.display = "none";
  }

  function handleEditStatusEnter(index) {
    const row = document.getElementById(`row-${index}`);
    const editStatus = row.querySelector(".edit-status");
    editStatus.style.display = "block";
  }
  function handleEditStatusLeave(index) {
    const row = document.getElementById(`row-${index}`);
    const editStatus = row.querySelector(".edit-status");
    editStatus.style.display = "none";
  }
  function handleEditStatusClick(index) {
    currentStudentRow = index;
    const row = document.getElementById(`row-${index}`);
    const status = row.querySelector(".status");
    const editStatus = row.querySelector(".edit-status");
    status.style.cursor = "text";
    status.removeAttribute("readonly");
    status.focus();
    setTimeout(() => status.select(), 0);
    status.addEventListener("blur", () => {
      status.setAttribute("readonly", true);
      status.setSelectionRange(0, 0);
      status.style.cursor = "pointer";
      if (currentStudentRow !== null) {
        list[currentStudentRow].status = status.value;
        list = [...list];
        currentStudentRow = null;
      }
    }, { once: true });
    editStatus.style.display = "none";
  }

  function handleLabelClick(label) {
    const choiceMark = document.querySelector(`.social-scholarship .choice-mark`);
    if (label === "label1" && choiceMark.style.left !== '429px') {
      increasedList = list;
      list = socialyList;
      currentList = 'socialy';
      choiceMark.style.left = '429px';
      choiceMark.style.width = '551px';
      setTimeout(() => {
        choiceMark.style.width = '270px';
      }, 200);
    } else if (label === "label2" && choiceMark.style.left !== '710px') {
      socialyList = list;
      list = increasedList;
      currentList = 'increased';
      choiceMark.style.width = '551px';
      setTimeout(() => {
        choiceMark.style.left = '710px';
        choiceMark.style.width = '270px';
      }, 200);
    }
  }

  onMount(() => {
    const choiceMark = document.querySelector(`.social-scholarship .choice-mark`);
    choiceMark.style.left = '429px';
    choiceMark.style.width = '270px';
    window.addEventListener('click', handleGlobalClick);
  });

  onDestroy(() => {
    window.removeEventListener('click', handleGlobalClick);
  });

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->

<div class="gui" id={thisId} style:opacity={$selectedSection === thisId ? 1 : 0} bind:this={this_}>
  
  <FileInput eId='session--package-of-documents--statements' extensions={['.xlsx']} type='excel'
    on:fileSelected={event => handleFileInputChange(event.detail)}
    on:fileRemoved={event => handleFileRemove(event.detail)}
  />

  <div class="social-scholarship">
    <div class="choice-mark"/>
    <div class="label1" on:click={() => handleLabelClick("label1")}>{_lng.packageOfDocuments.socialScholarship.label1}</div>
    <div class="label2" on:click={() => handleLabelClick("label2")}>{_lng.packageOfDocuments.socialScholarship.label2}</div>
    <div class="list" bind:this={eList}>
      {#each list as item, index}
        <div class="row" id={"row-" + index} class:unavailable={uploadedFile === null}
          style="grid-template-columns: {currentList === 'socialy' ? '25px 1fr 240px' : '25px 1fr 0px'};"
        >
          <div class="remove" on:click={() => handleRemoveRow(index)}>✕</div> 
          <div class="student" on:click={() => handleOpenStudentsList(index)}>
            {item.studentName ? item.studentName : _lng.packageOfDocuments.list.student}
          </div>
          <input class="status" type="text" readonly 
            value={currentList === 'socialy' ? item.status ? item.status : _lng.packageOfDocuments.list.socialy : ""}
            on:click={() => handleOpenStatusesList(index)} on:mouseenter={() => handleStatusEnter(index)} on:mouseleave={() => handleStatusLeave(index)}/>
          <div class="edit-status" on:click={() => handleEditStatusClick(index)} on:mouseenter={() => handleEditStatusEnter(index)} on:mouseleave={() => handleEditStatusLeave(index)}></div>
        </div>
      {/each}
    </div>
    <ul class="students-by-specialty" bind:this={eStudentsBySpecialty}>
      {#each Object.entries(studentNamesByCode) as [specialityCode, object]}
        <div class="speciality-code">----- {specialityCode} -----</div>
        <ul class="students">
          {#each object.students as studentName, studentIndex} 
            <li on:click={() => handleSetStudent(studentName, studentIndex, object.specialityIndex)}>
              {studentName}
            </li>
          {/each}
        </ul>
      {/each}
    </ul>
    <ul class="status-list" bind:this={eStatusList}>
      {#each statusesList as status}
        <li on:click={() => handleSetStatus(status)}>
          {status}
        </li>
      {/each}
    </ul>
    <div class="add" on:click={handleAddRow} class:unavailable={uploadedFile === null}></div>
  </div>

  <div class="percentage-of-scholarship">
    <div>{_lng.packageOfDocuments.percentageOfScholarship}</div>
    <input type="text" bind:this={ePercentage} value={data.percentage} class:unavailable={uploadedFile === null}/>
  </div>

  <div class="data-block" id="semester-dates">
    <div class="label">{_lng.packageOfDocuments.semesterDates.label}</div>
    <div class="row" id="start">
      <div>{_lng.packageOfDocuments.semesterDates.start}</div>
      <input type="text" bind:this={eSemesterStart} value={data.semesterStart} class:unavailable={uploadedFile === null}/>
    </div>
    <div class="row" id="end">
      <div>{_lng.packageOfDocuments.semesterDates.end}</div>
      <input type="text" bind:this={eSemesterEnd} value={data.semesterEnd} class:unavailable={uploadedFile === null}/>
    </div>
  </div>

  <div class="data-block" id="class-teacher-name">
    <div class="label">{_lng.packageOfDocuments.classTeacherName.label}</div>
    <div class="row" id="nominative">
      <div>{_lng.packageOfDocuments.classTeacherName.nominative}</div>
      <input type="text" bind:this={eKuratorNom} value={data.kuratorNom} class:unavailable={uploadedFile === null}/>
    </div>
    <div class="row" id="genitive">
      <div>{_lng.packageOfDocuments.classTeacherName.genitive}</div>
      <input type="text" bind:this={eKuratorGen} value={data.kuratorGen} class:unavailable={uploadedFile === null}/>
    </div>
  </div>

</div>

<style>
  .social-scholarship .choice-mark {
    position: fixed;
    top: 64px;
    left: 460px;
    width: 210px;
    height: 3px;
    margin-top: 5px;
    border-radius: 10px;
    background-color: var(--choiceMark-color);
    transition: 0.2s;
  }

  .social-scholarship {
    position: absolute;
    top: 37px;
    right: 10px;
    height: 234px;
    width: 550px;
    background-color: var(--background-reverse-color);
    border-width: 2px;
    display: grid;
    grid-template-rows: 1fr 29px;
    overflow: hidden;
  }

  .social-scholarship .label1 {
    position: fixed;
    top: 40px;
    left: 429px;
    height: 30px;
    width: 270px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 8px;
  }
  .social-scholarship .label2 {
    position: fixed;
    top: 40px;
    left: 710px;
    height: 30px;
    width: 270px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 8px;
  }

  .social-scholarship *:not(ul) {
    border-radius: 0px;
  }

  .list {
    overflow-y: auto;
  }
  .list::-webkit-scrollbar {
    display: none; /* Chrome, Safari и Edge */
  }
  
  .list .row {
    position: relative;
    display: grid;
    grid-template-columns: 25px 1fr 240px;
    height: 25px;
    align-items: center;
    border-bottom-width: 1px;
    border-radius: 0px;
  }

  .list .row * {
    cursor: pointer;
    height: 25px;
    display: flex;
    align-items: center;
    border-radius: 0px;
    min-width: 0;
  }

  .list .remove {
    justify-content: center;
    font-weight: bold;
  }
  .list .remove:hover {
    background-color: var(--button-hover-background-color1);
  }
  .list .remove:active {
    background-color: var(--button-active-background-color1);
  }
  
  .list .student {
    padding: 0px 5px 0px 5px;
  }
  .list .student:hover {
    background-color: var(--button-hover-background-color1);
  }
  .list .student:active {
    background-color: var(--button-active-background-color1);
  }
  
  .list .status {
    padding: 0px 5px 0px 5px;
    background-color: transparent;
    border-width: 0px;
  }
  .list .status:hover {
    background-color: var(--button-hover-background-color1);
  }
  .list .status:active {
    background-color: var(--button-active-background-color1);
  }
  .list .status:focus {
    background-color: transparent;
  }

  .list .row .student,
  .list .row .status {
    overflow: hidden;
    white-space: nowrap;
  }
  
  ul {
    position: fixed
  }
  .students {
    position: relative;
    width: 100%;
    border-radius: 0px;
    border-width: 0px;
    background-color: transparent;
  }
  .students li
  .students li:last-child {
    border-width: 0px;
    border-top-width: 1px;
  }
  .students-by-specialty .speciality-code:first-child {
    border-top-width: 0px;
  }
  .speciality-code {
    border-top-width: 1px;
    display: flex;
    justify-content: center; /* горизонтально */
    align-items: center;     /* вертикально */
  }
  :global(.social-scholarship .students-by-specialty) {
    overflow: auto;
    width: 330px;
    height: 200px;
    z-index: -1;
    opacity: 0;
  }
  :global(.social-scholarship .students-by-specialty.showed) {
    opacity: 1;
  }
  :global(.social-scholarship .status-list) {
    width: 200px;
    height: 190px;
    z-index: -1;
    opacity: 0;
  }
  :global(.social-scholarship .status-list.showed) {
    opacity: 1;
  }

  .add {
    position: relative;
    top: -1px;
    height: calc(100% - 1px);
    bottom: 0px;
    right: 0px;
    width: 100%;
    background-color: var(--button-background-color1);
    background-image: var(--add-background-image);
    background-size: 25px;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    border-top-width: 2px;
    cursor: pointer;
  }
  .add:hover {
    background-color: var(--button-hover-background-color1);
  }
  .add:active {
    background-color: var(--button-active-background-color1);
  }

  .percentage-of-scholarship {
    position: absolute;
    top: 300px;
    display: none;
    /* display: grid; */
    grid-template-columns: 210px 25px;
    row-gap: 5px;
  }
  .percentage-of-scholarship input {
    width: 50px;
    text-align: center;
    padding-left: 0px;
  }

  .data-block {
    position: absolute;
    top: 320px;
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

  .data-block#semester-dates .row {
    grid-template-columns: 160px 95px;
  }
  .data-block#class-teacher-name .row {
    grid-template-columns: 160px 230px;
  }

  #class-teacher-name{
    right: 30px;
  }

  .list .row .edit-status {
    position: absolute;
    top: 0px;
    right: 0px;
    height: 25px;
    width: 25px;
    background-image: var(--editStatus-background-image);
    background-size: 16px 16px;
    display: none;
  }
  .edit-status:hover {
    background-color: var(--button-hover-background-color1);
  }
  .edit-status:active {
    background-color: var(--button-active-background-color1);
  }

</style> 