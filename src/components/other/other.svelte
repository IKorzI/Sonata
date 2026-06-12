<script>
  import { onMount } from 'svelte';
  import { whatDocument, selectedSection, lng, message, handleInput } from '../../lib/store.js'

  let thisId = 'other--other';
  
  let _lng = {};
  lng.subscribe(value => (_lng = value));
  
  let this_;
  let isScreenshotMode = false;
  let eSemester1Start, eSemester1End, eSemester2Start, eSemester2End;
  let elComplete, isProcessing = false, isComleting = false;

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

  // Зміна режиму скріншота
  function screenshotMode() {
    // Перевірка на запуск у режимі vite-серверу без Electron
    if (!window.electron) return;
    // Зміна режиму у бекенді
    window.electron.screenshotMode(!isScreenshotMode);
    isScreenshotMode = !isScreenshotMode;
  }

  // При завантаженні компоненту у DOM
  onMount(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const semNum = month >= 7 ? 1 : 2;
    
    eSemester1Start.value  = semNum === 1  ?  `01.09.${year}`      :  `01.09.${year - 1}`;
    eSemester1End.value    = semNum === 1  ?  `31.12.${year}`      :  `31.12.${year - 1}`;
    eSemester2Start.value  = semNum === 1  ?  `01.01.${year + 1}`  :  `01.01.${year}`;
    eSemester2End.value    = semNum === 1  ?  `30.06.${year + 1}`  :  `30.06.${year}`;
  });

  // Анімація успіху
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

  // Індивідуальна обробка натискання на кнопку "Старт"
  async function numDenStart() {
    // Перевірка, чи все, що потрібно, внесено
    if (
      eSemester1Start.value === '' ||
      eSemester1End.value === '' ||
      eSemester2Start.value === '' ||
      eSemester2End.value === ''
    ) {
      message.set({type: 'error', text: 'other.numDen.notAllData'});
      return;
    }
    
    // Запит у користувача шляху для збереження
    const targetPath = await window.electron.saveDialog(_lng.other.numDen.saveName, '.xlsx');
    // Якщо відмова – повернутися
    if (!targetPath) return;

    // Якщо вже виконується робота – повернутися
    if (isProcessing) return;
    isProcessing = true; // Виконується процес

    // Збирання усієї інформації в одне ціле
    const data = {
      id: `${thisId}--num-den`,
      semester1Start: eSemester1Start.value,
      semester1End: eSemester1End.value,
      semester2Start: eSemester2Start.value,
      semester2End: eSemester2End.value,
      filePath: targetPath
    };

    // Запуск функції у бекенді і очікування відповіді
    let result = await window.electron.startBackendFunc(data);
    
    isComleting = true;
    isProcessing = false;
    completeAnimation();
  }

  // Обробка натискання на знак питання
  function handleWhat() {
    whatDocument.set(`${thisId}--num-den`);
  }
</script>

<div class='gui' id={thisId} style:opacity={$selectedSection === thisId ? 1 : 0} bind:this={this_}>

  <div class='block' id='screenshot-mode'>
    <div class='label'>{_lng.other.screenshotMode}</div>
    <button class={`screenshot-mode ${isScreenshotMode ? 'active' : ''}`} on:click={() => screenshotMode()}>{_lng.other.screenshotMode}</button>
  </div>
  
  <div class='block' id='num-den'>
    <div class='label'>{_lng.other.numDen.title}</div>
    <div class='input-block' id='start1'>
      <div>{_lng.other.numDen.start1}</div>
      <input type='date' bind:this={eSemester1Start} on:input={(e) => handleInput(e.target, { date: true })}/>
    </div>
    <div class='input-block' id='end1'>
      <div>{_lng.other.numDen.end1}</div>
      <input type='date' bind:this={eSemester1End} on:input={(e) => handleInput(e.target, { date: true })}/>
    </div>
    <div class='input-block' id='start2'>
      <div>{_lng.other.numDen.start2}</div>
      <input type='date' bind:this={eSemester2Start} on:input={(e) => handleInput(e.target, { numbers: true, period: true })}/>
    </div>
    <div class='input-block' id='end2'>
      <div>{_lng.other.numDen.end2}</div>
      <input type='date' bind:this={eSemester2End} on:input={(e) => handleInput(e.target, { numbers: true, period: true })}/>
    </div>
    <button class='start' on:click={() => numDenStart()}>
      {#if isProcessing === false && isComleting === false}
        {_lng.other.start}
      {/if}
      <div class='process' style='
        z-index: {isProcessing === true ? "1" : "-1"};
        display: {isProcessing === true ? "block" : "none"};
      '></div>
      <div class='complete' bind:this={elComplete}></div>
    </button>
    <div class='what' on:click={() => handleWhat()}></div>
  </div>

</div>

<style>

  .gui {
    display: flex;
    flex-wrap: wrap;
    column-gap: 15px;
    row-gap: 20px;
    align-content: flex-start;
    align-items: flex-start;
  }

  .block {
    border-radius: 20px;
    border-style: dashed;
    border-width: 3px;
    width: fit-content;
    height: auto;
    padding: 15px;

    display: flex;
    flex-direction: column;
    align-items: center;
    
    gap: 10px;
  }

  .label {
    position: relative;
    top: -5px;
  }

  button {
    height: 40px;
    width: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-width: 2px;
  }

  .input-block {
    display: grid;
    grid-template-columns: 170px 95px;
  }

  .screenshot-mode {
    height: 60px;
    width: 200px;
    font-size: 20px;
    border-width: 5px;
  }
  :global(.screenshot-mode.active) {
    background-color: rgba(0, 255, 120, 0.4);
    border-color: rgb(0, 159, 14);
  }

  .what {
    position: absolute;
    top: 186px;
    right: 250px;
    width: 30px;
    height: 30px;
    background-image: var(--inputFile-what-background-image);
    border-radius: 999px;
    cursor: pointer;
  }
  :global(.file-input .what.loaded) {
    transform: translateY(10px);
    opacity: 0;
  }
  .what:hover {
    background-color: var(--button-hover-background-color1);
  }
  .what:active {
    background-color: var(--button-active-background-color1);
  }

  .start {
    position: relative;
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