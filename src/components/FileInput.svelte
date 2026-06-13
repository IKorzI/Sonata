<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { whatDocument, clearInformation, lng } from '../lib/store.js'
  
  const dispatch = createEventDispatcher();
  export let extensions;
  export let type;
  export let eId;

  export let isLoaded = false;
  let prevIsLoaded = false;
  $: {
    // We track the state change (prevIsLoaded) so that the styles function triggers only at the moment of transition, not on every update
    if (isLoaded === true && prevIsLoaded === false) {
      stylesLoadedSet(true);
      prevIsLoaded = isLoaded;
    } else if (isLoaded === false && prevIsLoaded === true) {
      stylesLoadedSet(false);
      prevIsLoaded = isLoaded;
    }
  }
  
  let _lng = {};
  lng.subscribe(value => (_lng = value));
  let file = null;
  let fileInputEl;
  let fileName = '';
  $: label = {
    'session--package-of-documents--statements': _lng.fileInput.label.session.packageOfDocuments.statements,
    'session--empty-statements--hours': _lng.fileInput.label.session.emptyStatements.hours,
    'session--empty-statements--contingent': _lng.fileInput.label.session.emptyStatements.contingent,
    'session--report--statements': _lng.fileInput.label.session.report.statements,
    'session--debtors--statements': _lng.fileInput.label.session.debtors.statements,

    'hours--based-on-the-first-month--hours': _lng.fileInput.label.hours.basedOnTheFirstMonth.hours,
    'hours--summary-of-teachers--hours': _lng.fileInput.label.hours.summaryOfTeachers.hours
  }

  let eArea, eText, eName, eExtensions, eDelete, eWhat;
  $: backgroundImageUrl =
    type === 'excel' ? 'excel.png'
    : type === 'word' ?
    'word.png'
    : '';

  $: truncatedFileName = fileName.length > 15 ? fileName.substring(0, 15) + '...' : fileName;
  let mouseCounter = 0;
  let dragCounter = 0;

  $: if ($clearInformation) {
    handleClearInformation($clearInformation);
  }

  function handleClearInformation(info) {
    if (file && eId.includes(info)) {
      handleDelete();
      eArea.classList.remove('hovered');
      mouseCounter = 0
      dragCounter = 0
    }
  }

  function fileSelect(inputFile) {
    // For these identifiers, the file is passed further via dispatch, but is not visually attached to the input
    if (eId !== 'session--report--statements' && eId !== 'session--debtors--statements') {
      file = inputFile;
      fileName = file.name;
    }
    dispatch('fileSelected', { id: eId, file: inputFile });
  }

  function fileDelete() {
    file = null;
    fileName = '';
    fileInputEl.value = '';
    dispatch('fileRemoved', { id: eId });
  }

  function stylesLoadedSet(type) {
    if (type) {
      eArea.classList.add('unavailable')

      // A micro-delay is needed so that the browser has time to render the initial classes before starting the CSS transition
      setTimeout(() => {
        eArea.style.transition = '0.4s';
        eArea.classList.add('loaded');

        eText.style.transition = '0.4s';
        eText.classList.add('loaded');

        eName.style.zIndex = '0';
      
        eName.style.transition = '0.4s';
        eName.classList.add('loaded');

        eExtensions.style.transition = '0.4s';
        eExtensions.classList.add('loaded');

        eDelete.style.zIndex = '0';
        eDelete.style.transition = '0.4s';
        eDelete.classList.add('loaded');

        eWhat.style.transition = '0.4s';
        eWhat.classList.add('loaded');

        // 400ms corresponds to the duration of the CSS animation (0.4s). We clear the transition styles after it completes
     
        setTimeout(() => {
          eArea.classList.remove('unavailable')
          eArea.style.transition = null;
          eText.style.transition = null;
          eText.style.zIndex = '-1';
          eName.style.transition = null;
          eExtensions.style.transition = null;
          eExtensions.style.zIndex = '-1';
          eDelete.style.transition = null;
          eWhat.style.transition = null;
          eWhat.style.zIndex = '-1';
        }, 400);
      }, 10);
    } else {
      eArea.classList.add('unavailable')

      setTimeout(() => {
        eArea.style.transition = '0.4s';
        eArea.classList.remove('loaded');

        eText.style.zIndex = '0';
        eText.style.transition = '0.4s';
        eText.classList.remove('loaded');

        eName.style.transition = '0.4s';
        eName.classList.remove('loaded');

        eExtensions.style.zIndex = '0';
        eExtensions.style.transition = 
        '0.4s';
        eExtensions.classList.remove('loaded');

        eWhat.style.zIndex = '0';
        eWhat.style.transition = '0.4s';
        eWhat.classList.remove('loaded');

        eDelete.style.transition = '0.4s';
        eDelete.classList.remove('loaded');

        setTimeout(() => {
          eArea.classList.remove('unavailable')
          eArea.style.transition = null;
          eText.style.transition = null;
  
          eName.style.transition = null;
          eName.style.zIndex = '-1';
          eExtensions.style.transition = null;
          eWhat.style.transition = null;
          eDelete.style.transition = null;
          eDelete.style.zIndex = '-1';
        }, 400);
      }, 10);
    }
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files[0] || null;
    if (selectedFile && extensions.some(ext => selectedFile.name.endsWith(ext))) {
      fileSelect(selectedFile)
      if (eId === 'session--report--statements' || eId === 'session--debtors--statements') {
        fileDelete();
      }
    }
  }

  function handleClick() {
    if (file === null && fileInputEl) {
      fileInputEl.click();
    }
  }

  function handleDragOver(event) {
    if (file === null) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleDrop(event) {
    if (file === null) {
      event.preventDefault();
      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile && extensions.some(ext => droppedFile.name.endsWith(ext))) {
        fileSelect(droppedFile)
        if (eId === 'session--report--statements' || eId === 'session--debtors--statements') {
          fileDelete();
        }
      }
    }
  }

  function handleDelete(event) {
    fileDelete();
    stylesLoadedSet(false)
  }

  function handleWhat() {
    whatDocument.set(eId)
  }

  onMount(() => {
    // Counters (mouseCounter, dragCounter) and delays prevent the hovered state from "flickering" when crossing child elements inside eArea
    eArea.addEventListener('mouseenter', (e) => {
      if (file !== null) return;
      mouseCounter++;
      eArea.classList.add('hovered');
    });

    eArea.addEventListener('mouseleave', (e) => {
      if (file !== null) return;
      setTimeout(() => {
       
        mouseCounter--;
        if (mouseCounter <= 0) {
      
          mouseCounter = 0;
          eArea.classList.remove('hovered');
        }
      }, 10)
    });

    eArea.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      eArea.classList.add('hovered');
    });

    eArea.addEventListener('dragleave', (e) => {
    
      e.preventDefault();
      setTimeout(() => {
        dragCounter--;
       
        if (dragCounter <= 0) {
          dragCounter = 0;
          eArea.classList.remove('hovered');
        }
      }, 10)
    });
    eArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      mouseCounter = 0;
      eArea.classList.remove('hovered');
    });
    eArea.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
  });
  onDestroy(() => {
    eArea.removeEventListener('mouseenter');
    eArea.removeEventListener('mouseleave');
    eArea.removeEventListener('dragenter');
    eArea.removeEventListener('dragleave');
    eArea.removeEventListener('drop');
    eArea.removeEventListener('dragover');
  });
</script>

<div
  class='file-input'
  id={eId}
>

  <div class='label'>{label[eId]}</div>
  
  <div class='area'
    bind:this={eArea}
    on:click={handleClick}
    on:dragover={handleDragOver}
    on:drop={handleDrop}
  >
    <div class='text' bind:this={eText}>{_lng.fileInput.area.text}</div>
    <div class='name' bind:this={eName}>{truncatedFileName}</div>
    <div class='extensions' bind:this={eExtensions}>{extensions.join(', ')}</div>
    <div class='img' class:loaded={file !== null} style:background-image={`url(${backgroundImageUrl})`}></div>
    <div class='delete' bind:this={eDelete} on:click|stopPropagation={handleDelete}></div>
    <div class='what' bind:this={eWhat} on:click|stopPropagation={handleWhat}></div>
  </div>

  <input
    type='file'
    accept={extensions.join(', ')}
    bind:this={fileInputEl}
    style='display: none;'
    on:change={handleFileChange}
  />
</div>

<style>
  .area, .area * {
    cursor: pointer;
  }
  :global(.program .area.loaded), :global(.program .area .loaded:not(.delete)) {
    cursor: default;
  }

  .file-input {
    position: relative;
    height: auto;
    width: 176px;
    display: grid;
    grid-template-rows: 40px 176px;
  }

  .area {
    position: relative;
    border-radius: 40px;
    border-style: dashed;
    border-width: 3px;
    border-color: rgb(153, 153, 153);
    display: flex;
    justify-content: center;
  }
  :global(.program .area.loaded) {
    border-color: green;
  }
  :global(.area.hovered) {
    background-color: var(--button-background-color1);
  }
  :global(.area.unavailable) {
    pointer-events: none;
  }

  .label {
    line-height: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .text {
    position: absolute;
    top: 8px;
  }
  :global(.file-input .text.loaded) {
    transform: translateY(10px);
    opacity: 0;
  }

  .name {
    position: absolute;
    top: 25px;
    opacity: 0;
  }
  :global(.file-input .name.loaded) {
    transform: translateY(-10px);
    opacity: 1;
  }

  .extensions {
    position: absolute;
    top: 30px;
  }
  :global(.file-input .extensions.loaded) {
    transform: translateY(10px);
    opacity: 0;
  }

  .img {
    position: absolute;
    top: 60px;
    width: 60px;
    height: 60px;
    background-repeat: no-repeat;
    background-position: center;
    transition: 0.8s;
  }
  :global(.file-input .img.loaded) {
    transform: translateY(-13px);
  }

  .delete {
    position: absolute;
    top: 130px;
    width: 30px;
    height: 30px;
    background-image: var(--inputFile-delete-background-image);
    opacity: 0;
    border-radius: 999px;
  }
  :global(.file-input .delete.loaded) {
    transform: translateY(-10px);
    opacity: 1;
  }
  .delete:hover {
    background-color: var(--button-hover-background-color1);
  }
  .delete:active {
    background-color: var(--button-active-background-color1);
  }

  .what {
    position: absolute;
    top: 130px;
    width: 30px;
    height: 30px;
    background-image: var(--inputFile-what-background-image);
    border-radius: 999px;
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

</style>