<script>
  import { whatDocument, lng } from '../lib/store.js'
  
  let scale = 1;
  let minScale = 1;
  let maxScale = 1;
  let scaleStep = 0.1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX, startY;

  let raf = null;
  let containerEl;
  let areaEl;
  // Храним ссылки на DOM-элементы изображений
  let imgRefs = {};
  // Храним размеры для каждого загруженного изображения
  let imageDimensions = {}; 

  let imageNaturalWidth = 0;
  let imageNaturalHeight = 0;

  // 1. Статичная структура файлов (не зависит от языка)
  const FILE_STRUCTURE = {
    "hours--based-on-the-first-month": [
      "based-on-the-first-month--september",
      "based-on-the-first-month--october",
      "based-on-the-first-month--november",
      "based-on-the-first-month--december",
      "based-on-the-first-month--total"
    ],
    "hours--summary-of-teachers": ["summary-of-teachers"],
    "session--empty-statements": [
      "empty-statements--general",
      "empty-statements--statements"
    ],
    "session--package-of-documents": [
      "package-of-documents--summary",
      "package-of-documents--rating",
      "package-of-documents--petition",
      "package-of-documents--submission",
      "package-of-documents--explanation",
      "package-of-documents--rating-on-website"
    ],
    "session--report": ["report"],
    "session--debtors": ["debtors"],
    "other--other--num-den": ["num-den"],
    "hours--based-on-the-first-month--hours": ["hours"],
    "hours--summary-of-teachers--hours": ["hours"],
    "session--empty-statements--contingent": ["contingent"],
    "session--empty-statements--hours": ["hours"],
    "session--package-of-documents--statements": ["statements"],
    "session--report--statements": ["statements"],
    "session--debtors--statements": ["statements"]
  };

  // 2. Получаем массив уникальных имен файлов железно 1 раз
  const uniqueImageNames = [...new Set(Object.values(FILE_STRUCTURE).flat())];

  // 3. Реактивный объект для рендера интерфейса с использованием $lng напрямую
  $: names = {
    "hours--based-on-the-first-month": {
      downloadable: false,
      filesToDisplay: [
        {filePath: "based-on-the-first-month--september", displayName: $lng.exampleWindow.names.basedOnTheFirstMonth.september},
        {filePath: "based-on-the-first-month--october", displayName: $lng.exampleWindow.names.basedOnTheFirstMonth.october},
        {filePath: "based-on-the-first-month--november", displayName: $lng.exampleWindow.names.basedOnTheFirstMonth.november},
        {filePath: "based-on-the-first-month--december", displayName: $lng.exampleWindow.names.basedOnTheFirstMonth.december},
        {filePath: "based-on-the-first-month--total", displayName: $lng.exampleWindow.names.basedOnTheFirstMonth.total}
      ]
    },
    "hours--summary-of-teachers": {
      downloadable: false,
      filesToDisplay: [
        {filePath: "summary-of-teachers", displayName: $lng.exampleWindow.names.summaryOfTeachers}
      ]
    },
   
    "session--empty-statements": {
      downloadable: false,
      filesToDisplay: [
        {filePath: "empty-statements--general", displayName: $lng.exampleWindow.names.emptyStatements.general},
        {filePath: "empty-statements--statements", displayName: $lng.exampleWindow.names.emptyStatements.statements}
      ]
    },
    "session--package-of-documents": {
      downloadable: false,
      filesToDisplay: [
        {filePath: "package-of-documents--summary", displayName: $lng.exampleWindow.names.packageOfDocuments.summary},
        {filePath: "package-of-documents--rating", displayName: $lng.exampleWindow.names.packageOfDocuments.rating},
        {filePath: "package-of-documents--petition", displayName: $lng.exampleWindow.names.packageOfDocuments.petition},
        {filePath: "package-of-documents--submission", displayName: $lng.exampleWindow.names.packageOfDocuments.submission},
        {filePath: "package-of-documents--explanation", displayName: $lng.exampleWindow.names.packageOfDocuments.explanation},
        {filePath: "package-of-documents--rating-on-website", displayName: $lng.exampleWindow.names.packageOfDocuments.ratingOnWebsite}
      ]
    },
    "session--report": {
      downloadable: false,
      filesToDisplay: [
        {filePath: "report", displayName: $lng.exampleWindow.names.report}
      ]
    },
    "session--debtors": {
      downloadable: false,
      filesToDisplay: [
        {filePath: "debtors", displayName: $lng.exampleWindow.names.debtors}
      ]
    },
    "other--other--num-den": {
      downloadable: false,
      filesToDisplay: [
        {filePath: "num-den", displayName: $lng.exampleWindow.names.numDen}
      ]
    },

    "hours--based-on-the-first-month--hours": {
      downloadable: true,
      fileNameToSave: $lng.exampleWindow.names.hours.fileNameToSave,
      filePathToSave: "hours",
      filesToDisplay: [
        {filePath: "hours", displayName: $lng.exampleWindow.names.hours.displayName}
      ]
    },
    "hours--summary-of-teachers--hours": {
      downloadable: true,
      fileNameToSave: $lng.exampleWindow.names.hours.fileNameToSave,
      filePathToSave: "hours",
      filesToDisplay: [
        {filePath: "hours", displayName: $lng.exampleWindow.names.hours.displayName}
      ]
    },
    "session--empty-statements--contingent": {
      downloadable: true,
      fileNameToSave: $lng.exampleWindow.names.contingent.fileNameToSave,
      filePathToSave: "contingent",
      filesToDisplay: [
        {filePath: "contingent", displayName: $lng.exampleWindow.names.contingent.displayName}
      ]
    },
    "session--empty-statements--hours": {
      downloadable: true,
      fileNameToSave: $lng.exampleWindow.names.hours.fileNameToSave,
      filePathToSave: "hours",
      filesToDisplay: [
        {filePath: "hours", displayName: $lng.exampleWindow.names.hours.displayName}
      ]
    },
    "session--package-of-documents--statements": {
      downloadable: true,
      fileNameToSave: $lng.exampleWindow.names.statements.fileNameToSave,
      filePathToSave: "statements",
      filesToDisplay: [
        {filePath: "statements", displayName: $lng.exampleWindow.names.statements.displayName}
      ]
    },
    "session--report--statements": {
      downloadable: true,
      fileNameToSave: $lng.exampleWindow.names.statements.fileNameToSave,
      filePathToSave: "statements",
      filesToDisplay: [
        {filePath: "statements", displayName: $lng.exampleWindow.names.statements.displayName}
      ]
    },
    "session--debtors--statements": {
      downloadable: true,
      fileNameToSave: $lng.exampleWindow.names.statements.fileNameToSave,
      filePathToSave: "statements",
      filesToDisplay: [
        {filePath: "statements", displayName: $lng.exampleWindow.names.statements.displayName}
      ]
    }
  }

  // Реактивная переменная для списка изображений текущего документа
  $: currentImages = $whatDocument && names[$whatDocument] ?
    names[$whatDocument].filesToDisplay : [];

  let activeImgName = null;
  let prevDocument = null;
  let showDownload = false;
  let downloadTimeout = null;
  let imageTimeout = null; // таймер для задержки скрытия картинки
  
  // Реактивно назначаем первое изображение активным при смене документа
  $: {
    if ($whatDocument !== prevDocument) {
      clearTimeout(imageTimeout); // Обязательно сбрасываем таймер, если пользователь быстро передумал

      if ($whatDocument) {
        // Окно открывается или меняется документ — показываем картинку сразу
        if (currentImages.length > 0) {
          activeImgName = currentImages[0].filePath;
        } else {
          activeImgName = null;
        }
      } else {
        // Окно закрывается — убираем картинку с задержкой
        imageTimeout = setTimeout(() => {
          activeImgName = null;
        }, 500);
      }
      
      prevDocument = $whatDocument;
    }

    const isDownloadable = $whatDocument && names[$whatDocument] && names[$whatDocument].downloadable;
    if (isDownloadable) {
      clearTimeout(downloadTimeout);
      showDownload = true;
    } else {
      clearTimeout(downloadTimeout);
      downloadTimeout = setTimeout(() => {
        showDownload = false; // Прячем через 0.5с (когда анимация окна уже завершится)
      }, 500);
    }
  }

  // Функция для переключения изображений кликом по кнопке
  function switchImage(filePath) {
    activeImgName = filePath;
  }

  $: {
    if ($whatDocument) {
      stylesLoadedSet(true);
      // Если изображение уже было загружено ранее, пересчитываем трансформацию
      if (activeImgName && imageDimensions[activeImgName]) {
        // Используем setTimeout, чтобы DOM успел применить класс .visible перед расчетами
        setTimeout(() => initTransformForActiveImage(activeImgName), 0);
      }
    } else {
      stylesLoadedSet(false);
    }
  }

  function stylesLoadedSet(type) {
    if (type) {
      if (!areaEl || !containerEl) return;
      areaEl.style.zIndex = '10';
      areaEl.style.transition = '0.4s';
      areaEl.classList.add('loaded');

      containerEl.style.transition = '0.4s';
      containerEl.classList.add('loaded');
      setTimeout(() => {
        if(areaEl) areaEl.style.transition = null;
        if(containerEl) containerEl.style.transition = null;
      }, 400);
    } else {
      if (!areaEl || !containerEl) return;
      areaEl.style.transition = '0.4s';
      areaEl.classList.remove('loaded');
      containerEl.style.transition = '0.4s';
      containerEl.classList.remove('loaded');

      setTimeout(() => {
        if(areaEl) {
          areaEl.style.transition = null;
          areaEl.style.zIndex = '-1';
        }
        if(containerEl) containerEl.style.transition = null;
      }, 400);
    }
  }

  function initTransformForActiveImage(imgName) {
    if (!containerEl || !imageDimensions[imgName]) return;

    const containerRect = containerEl.getBoundingClientRect();
    imageNaturalWidth = imageDimensions[imgName].width;
    imageNaturalHeight = imageDimensions[imgName].height;

    const containerWith = containerRect.width - 4;
    const containerHeight = containerRect.height - 4;

    const scaleX = containerWith / imageNaturalWidth;
    const scaleY = containerHeight / imageNaturalHeight;

    scale = scaleX;

    minScale = Math.min(scaleX, scaleY);
    maxScale = minScale * 7;
    scaleStep = (maxScale - minScale) / 15;

    const imageWidth = imageNaturalWidth * scale;
    const imageHeight = imageNaturalHeight * scale;

    translateX = (containerWith - imageWidth) / 2;
    translateY = imageHeight > containerHeight ? 0 : (containerHeight - imageHeight) / 2;

    updateTransform();
  }

  function handleImageLoad(event, imgName) {
    imageDimensions[imgName] = {
      width: event.target.naturalWidth,
      height: event.target.naturalHeight
    };
    if (imgName === activeImgName) {
      initTransformForActiveImage(imgName);
    }
  }

  function updateTransform() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const activeImgEl = imgRefs[activeImgName];
      if (!activeImgEl || !containerEl) return;

      const containerRect = containerEl.getBoundingClientRect();
      const containerWith = containerRect.width - 4;
      const containerHeight = containerRect.height - 4;
      const imageWidth = imageNaturalWidth * scale;
      const imageHeight = imageNaturalHeight * scale;

      const minTranslateX = imageWidth < containerWith
        ? (containerWith - imageWidth) / 2
        : Math.min(containerWith - imageWidth, 0);

      const minTranslateY = imageHeight < containerHeight
        ? (containerHeight - imageHeight) / 2
        : Math.min(containerHeight - imageHeight, 0);

      const maxTranslateX = imageWidth < containerWith
        ? minTranslateX
        : 0;

      const maxTranslateY = imageHeight < containerHeight
        ? minTranslateY
        : 0;

      translateX = Math.min(maxTranslateX, Math.max(minTranslateX, translateX));
      translateY = Math.min(maxTranslateY, Math.max(minTranslateY, translateY));

      // 1. Задаем физические размеры вместо масштабирования через transform
      activeImgEl.style.width = `${imageWidth}px`;
      activeImgEl.style.height = `${imageHeight}px`;
      
      // 2. В transform оставляем ТОЛЬКО перемещение
      activeImgEl.style.transform = `translate(${translateX}px, ${translateY}px)`;
    });
  }

  function handleWheel(event) {
    event.preventDefault();

    const scrollSpeed = 50;

    if (event.ctrlKey) {
      const delta = event.deltaY > 0 ? -scaleStep : scaleStep;
      const newScaleUnclamped = scale + delta;
      const newScale = Math.max(minScale, Math.min(newScaleUnclamped, maxScale));

      const containerRect = containerEl.getBoundingClientRect();
      const mouseX = event.clientX - containerRect.left;
      const mouseY = event.clientY - containerRect.top;

      const dx = (mouseX - translateX) / scale;
      const dy = (mouseY - translateY) / scale;

      translateX -= dx * (newScale - scale);
      translateY -= dy * (newScale - scale);

      scale = newScale;
    } else if (event.shiftKey) {
      const deltaX = event.deltaX !== 0 ? event.deltaX : event.deltaY;
      translateX -= deltaX > 0 ? scrollSpeed : -scrollSpeed;
    } else {
      translateY -= event.deltaY > 0 ? scrollSpeed : -scrollSpeed;
    }

    updateTransform();
  }

  // Требование 3: Функция сброса масштаба по ширине окна
  function handleScaleByWidth() {
    if (!containerEl || !activeImgName || !imageDimensions[activeImgName]) return;

    const containerRect = containerEl.getBoundingClientRect();
    const containerWith = containerRect.width - 4;
    const containerHeight = containerRect.height - 4;

    scale = containerWith / imageNaturalWidth;

    const imageWidth = imageNaturalWidth * scale;
    const imageHeight = imageNaturalHeight * scale;

    translateX = (containerWith - imageWidth) / 2;
    translateY = imageHeight > containerHeight ? 0 : (containerHeight - imageHeight) / 2;

    updateTransform();
  }

  function handleMouseDown(event) {
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
  }

  function handleMouseMove(event) {
    if (!isDragging) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    startX = event.clientX;
    startY = event.clientY;

    translateX += dx;
    translateY += dy;

    updateTransform();
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function handleMouseLeave() {
    isDragging = false;
  }

  function handleDelete() {
    whatDocument.set(null);
  }

  async function handleDownload() {
    if (!window.electron) return;
    if (!$whatDocument) return;

    const baseName = names[$whatDocument].filePathToSave;
    const basePath = 'examples/save/';
    const fileInfo = await window.electron.findFileWithExtension(basePath, baseName);
    if (!fileInfo) {
      alert('File not found');
      return;
    }

    const { fullPath, extension } = fileInfo;
    const fileName = names[$whatDocument].fileNameToSave;
    const targetPath = await window.electron.saveDialog(fileName, extension);
    if (!targetPath) return;

    const result = await window.electron.saveFile(fullPath, targetPath);
    if (!result.success) {
      alert('Error saving file: ' + result.error);
    }
  }

  function handleScaleUp() {
    scale = Math.min(maxScale, scale + scaleStep);
    updateTransform();
  }
  function handleScaleDown() {
    scale = Math.max(minScale, scale - scaleStep);
    updateTransform();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->

<div class="example-area" bind:this={areaEl}>
  <div
    class="example-window"
    bind:this={containerEl}
    on:wheel={handleWheel}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:mouseleave={handleMouseLeave}
  >
    <button 
      class="close" 
      class:rounded-corner={!showDownload} 
      on:click|stopPropagation={handleDelete}
    >✕</button>
    {#if showDownload}
      <button class="download" on:click|stopPropagation={handleDownload}></button>
    {/if}
    
    <button class="scale-up" on:click|stopPropagation={handleScaleUp}></button>
    <button class="scale-by-width" on:click|stopPropagation={handleScaleByWidth}></button>
    <button class="scale-down" on:click|stopPropagation={handleScaleDown}></button>
    
    {#each uniqueImageNames as imgName (imgName)}
      <img
        src={'examples/save/' + imgName + '.png'}
        alt="Zoomable {imgName}"
        class="zoom-image {imgName === activeImgName ? 'visible' : ''}"
        draggable="false"
        on:load={(e) => handleImageLoad(e, imgName)}
        bind:this={imgRefs[imgName]}
      />
    {/each}

    {#if currentImages.length > 1}
      <div class="nav-buttons-container" on:mousedown|stopPropagation>
        {#each currentImages as imgInfo}
          <button 
            class="nav-button {imgInfo.filePath === activeImgName ? 'active' : ''}"
            on:click|stopPropagation={() => switchImage(imgInfo.filePath)}
          >
            {imgInfo.displayName}
          </button>
        {/each}
      </div>
    {/if}

  </div>
</div>

<style>
  .example-area {
    position: absolute;
    top: 27px;
    left: 0;
    height: calc(100% - 27px);
    width: 100%;
    background-color: var(--ExampleArea-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    z-index: -1;
    transition: 0.4s;
    border-radius: 0px;
  }
  :global(.example-area.loaded) {
    opacity: 1;
  }

  .example-window {
    height: 500px;
    width: 900px;
    background-color: var(--ExampleArea-window-background-color);
    overflow: hidden;
    position: relative;
    border-width: 2px;
    cursor: grab;
    transform: translateY(+20px);
  }
  :global(.example-area .example-window.loaded) {
    transform: translateY(0px);
  }
  .example-window:active {
    cursor: grabbing;
  }

  button {
    position: absolute;
    height: 25px;
    width: 25px;
    background-color: transparent;
    border: none;
    border-radius: 0px;
    z-index: 1;
  }

  .close {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    top: 0px;
    right: 0px;
    background-color: var(--ExampleArea-window-close-background-color);
  }
  .close:hover {
    background-color: var(--ExampleArea-window-close-hover-background-color);
  }
  .close:active {
    background-color: var(--ExampleArea-window-close-active-background-color);
  }
  .close.rounded-corner {
    border-bottom-left-radius: 6px;
  }

  .download {
    top: 0px;
    right: 25px;
    border-bottom-left-radius: 6px;
    background-image: var(--ExampleArea-window-download-background-image);
    background-color: var(--ExampleArea-window-button-background-color);
    background-size: 15px;
  }
  .download:hover {
    background-color: var(--ExampleArea-window-button-hover-background-color);
  }
  .download:active {
    background-color: var(--ExampleArea-window-button-active-background-color);
  }

  .scale-up {
    bottom: 0px;
    right: 0px;
    background-image: var(--ExampleArea-window-scaleUp-background-image);
    background-color: var(--ExampleArea-window-button-background-color);
  }
  .scale-up:hover {
    background-color: var(--ExampleArea-window-button-hover-background-color);
  }
  .scale-up:active {
    background-color: var(--ExampleArea-window-button-active-background-color);
  }

  .scale-by-width {
    bottom: 0px;
    right: 25px;
    border-radius: 0px;
    background-image: var(--ExampleArea-window-scaleByWidth-background-image);
    background-color: var(--ExampleArea-window-button-background-color);
  }
  .scale-by-width:hover {
    background-color: var(--ExampleArea-window-button-hover-background-color);
  }
  .scale-by-width:active {
    background-color: var(--ExampleArea-window-button-active-background-color);
  }

  .scale-down {
    bottom: 0px;
    right: 50px;
    border-top-left-radius: 6px;
    background-image: var(--ExampleArea-window-scaleDown-background-image);
    background-color: var(--ExampleArea-window-button-background-color);
  }
  .scale-down:hover {
    background-color: var(--ExampleArea-window-button-hover-background-color);
  }
  .scale-down:active {
    background-color: var(--ExampleArea-window-button-active-background-color);
  }

  .zoom-image {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: top left;
    user-select: none;
    pointer-events: none;
    transition: 0s;
    opacity: 0;
    visibility: hidden;
  }
  
  .zoom-image.visible {
    opacity: 1;
    visibility: visible;
  }

  .nav-buttons-container {
    position: absolute;
    left: 0;
    bottom: 0;
    width: calc(100% - 95px);
    display: flex;
    box-sizing: border-box;
    overflow-x: auto;
    border-radius: 0px;
  }

  :global(.nav-buttons-container button:last-child) {
    border-top-right-radius: 8px;
  }

  .nav-button {
    position: static; 
    height: 25px;
    width: auto;
    padding: 0px 5px;
    white-space: nowrap;
    flex-shrink: 0;
    background-color: var(--ExampleArea-window-button-background-color);
  }

  .nav-button:hover {
    background-color: var(--ExampleArea-window-button-hover-background-color);
  }

  .nav-button.active {
    background-color: #007bff;
  }
</style>