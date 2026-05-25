<script>
  import { selectedSection, clearInformation, saveInformation, savedInformation, message } from '../lib/store.js'

  import SessionPackageOfDocuments from './session/package-of-documents.svelte';
  import SessionEmptyStatements from './session/empty-statements.svelte';
  import SessionReport from './session/report.svelte';
  import SessionDebtors from './session/debtors.svelte';


  import HoursBasedOnTheFirstMonth from './hours/based-on-the-first-month.svelte';
  import HoursSummaryOfTeachers from './hours/summary-of-teachers.svelte';

  import OtherTemplates from './other/templates.svelte';
  import OtherOther from './other/other.svelte';

  $: if($savedInformation) {
    //console.log($savedInformation)
    start()
  }

  let isProcessing = false;
  let isComleting = false;
  let elComplete;

  const startSections = [
    'session--empty-statements',
    'session--package-of-documents',
    'session--report',
    'session--debtors',
    'hours--based-on-the-first-month',
    'hours--summary-of-teachers'
  ]
  $: isVisible = startSections.includes($selectedSection);

  function completeAnimation() {
    elComplete.style.transition = 'clip-path 0s';
    elComplete.style.clipPath = 'inset(0 100% 0 0)';
    setTimeout(() => {
      elComplete.style.transition = 'clip-path 0.4s ease-in-out';
      elComplete.style.zIndex = '1';
      elComplete.style.display = 'block';
      setTimeout(() => {
        elComplete.style.clipPath = 'inset(0 0 0 0)';
      }, 50);
    }, 50);
    setTimeout(() => {
      elComplete.style.zIndex = '-1';
      elComplete.style.display = 'none';
      setTimeout(() => {
        elComplete.style.transition = '';
        isComleting = false;
      }, 50);
    }, 1100);
  }

  async function start() {
    if (isProcessing || $savedInformation?.id === undefined) return;
    isProcessing = true;
    let result = await window.electron.startBackendFunc($savedInformation);
    console.log(result)
    
    if (result.success === true && (result.files?.length > 0 || result.customText)) {
      let messageText = "";
      if (result.files.length > 0) {
        messageText = "Файл або декілька файлів відкриті та заблоковані для редагування.\nТакі файли були збережені з цими назвами:";
        result.files.forEach(file => {
          messageText += `\n  – ${file}`;
        });
      }
      if (result.customText) {
        if (!messageText) {
          messageText = result.customText;
        } else {
          messageText = `${messageText}\n${result.customText}`;
        }
      }
      message.set({type: 'warning', text: messageText});
    } else if (result.success === true && result.notFoundSubjects?.length > 0) {
      let messageText = "";
      if (result.notFoundSubjects.length > 0) {
        messageText = "Наступні предмети не були знайдені і норми годин були залишені порожніми:";
        result.notFoundSubjects.forEach(group => {
          messageText += `\n  – ${group.group}: ${group.subjects.join(", ")}`;
        });
      }
      message.set({type: 'warning', text: messageText});
    }

    isComleting = true
    isProcessing = false;
    completeAnimation()
  }

  function clear() {
    clearInformation.set($selectedSection)
  }

  async function save() {
    if (!window.electron) return;
    saveInformation.set($selectedSection)
  }

</script>

<div class="workspace">

  <button class="clear" class:hidden={!isVisible} on:click={() => clear()}>Очистити</button>
  <button class="start" class:hidden={!isVisible} on:click={() => save()}>
    {#if isProcessing === false && isComleting === false}
      Старт
    {/if}
    <div class="process" style="
      z-index: {isProcessing === true ? '1' : '-1'};
      display: {isProcessing === true ? 'block' : 'none'};
    "></div>
    <div class="complete" bind:this={elComplete}></div>
  </button>

  <SessionPackageOfDocuments />
  <SessionEmptyStatements />
  <SessionReport />
  <SessionDebtors />

  <HoursBasedOnTheFirstMonth />
  <HoursSummaryOfTeachers />

  <OtherTemplates />
  <OtherOther />

</div>

<style>
  .workspace {
    position: absolute;
    bottom: 15px;
    right: 10px;
    height: calc(100% - 57px);
    width: calc(100% - 240px);
    opacity: 1;
  }

  button {
    position: absolute;
    bottom: 20px;
    height: 40px;
    width: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-width: 2px;
  }

  .clear {
    right: 140px;
    z-index: 1;
  }
  .start {
    right: 20px;
    z-index: 1;
  }

  .process {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 25px;
    width: 25px;
    background-image: var(--startProcess-background-image);
    z-index: -1;
    display: none;
    animation: spin 2s linear infinite;
  }

  .complete {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    height: 25px;
    width: 25px;
    background-image: url('../done.png');
    z-index: -1;
    display: none;
  }

  /* Анимация вращения */
  @keyframes spin {
    from {
      transform: translate(-50%, -50%) rotate(360deg);
    }
    to {
      transform: translate(-50%, -50%) rotate(0deg);
    }
  }

  .hidden {
    display: none;
    z-index: -1;
  }

</style> 