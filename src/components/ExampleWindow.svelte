<script>
  import { whatDocument } from '../lib/store.js'
  
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
  
  const names = {
    "hours--based-on-the-first-month": {
      fileNameToSave: "Години",
      filePathToSave: "based-on-the-first-month",
      filesToDisplay: [
        {filePath: "based-on-the-first-month", displayName: "Години"}
      ]
    },
    "hours--summary-of-teachers": {
      fileNameToSave: "Години",
      filePathToSave: "summary-of-teachers",
      filesToDisplay: [
        {filePath: "summary-of-teachers", displayName: "Години"}
      ]
    },
    "session--empty-statements": {
      fileNameToSave: "Відомості",
      filePathToSave: "empty-statements",
      filesToDisplay: [
        {filePath: "empty-statements", displayName: "Відомості"}
      ]
    },
    "session--package-of-documents": {
      fileNameToSave: "Відомості",
      filePathToSave: "package-of-documents",
      filesToDisplay: [
        {filePath: "package-of-documents--summary", displayName: "Зведена"},
        {filePath: "package-of-documents--rating", displayName: "Рейтингова"},
        {filePath: "package-of-documents--petition", displayName: "Клопотання"},
        {filePath: "package-of-documents--submission", displayName: "Подання"},
        {filePath: "package-of-documents--explanation", displayName: "Пояснення"},
        {filePath: "package-of-documents--rating-on-website", displayName: "Рейтинг на сайт"},
      ]
    },
    "session--report": {
      fileNameToSave: "Звіт",
      filePathToSave: "report",
      filesToDisplay: [
        {filePath: "report", displayName: "Звіт"}
      ]
    },
    "session--debtors": {
      fileNameToSave: "Боржники",
      filePathToSave: "debtors",
      filesToDisplay: [
        {filePath: "debtors", displayName: "Боржники"}
      ]
    },

    "hours--based-on-the-first-month--hours": {
      fileNameToSave: "Години",
      filePathToSave: "based-on-the-first-month",
      filesToDisplay: [
        {filePath: "hours", displayName: "Години"}
      ]
    },
    "hours--summary-of-teachers--hours": {
      fileNameToSave: "Години",
      filePathToSave: "summary-of-teachers",
      filesToDisplay: [
        {filePath: "hours", displayName: "Години"}
      ]
    },
    "session--empty-statements--contingent": {
      fileNameToSave: "Контингент",
      filePathToSave: "empty-statements",
      filesToDisplay: [
        {filePath: "contingent", displayName: "Контингент"}
      ]
    },
    "session--empty-statements--hours": {
      fileNameToSave: "Години",
      filePathToSave: "empty-statements",
      filesToDisplay: [
        {filePath: "hours", displayName: "Години"}
      ]
    },
    "session--package-of-documents--statements": {
      fileNameToSave: "Відомості",
      filePathToSave: "package-of-documents",
      filesToDisplay: [
        {filePath: "statements", displayName: "Відомості"}
      ]
    },
    "session--report--statements": {
      fileNameToSave: "Відомості",
      filePathToSave: "report",
      filesToDisplay: [
        {filePath: "statements", displayName: "Відомості"}
      ]
    },
    "session--debtors--statements": {
      fileNameToSave: "Відомості",
      filePathToSave: "debtors",
      filesToDisplay: [
        {filePath: "statements", displayName: "Відомості"}
      ]
    }
  }

  // Получаем массив уникальных имен файлов, проходя по всем массивам filesToDisplay
  const uniqueImageNames = [...new Set(
    Object.values(names).flatMap(doc => doc.filesToDisplay.map(file => file.filePath))
  )];
  console.log(uniqueImageNames)

  // Реактивная переменная для списка изображений текущего документа
  $: currentImages = $whatDocument && names[$whatDocument] ? names[$whatDocument].filesToDisplay : [];

  let activeImgName = null;
  let prevDocument = null;

  // Реактивно назначаем первое изображение активным при смене документа
  $: {
    if ($whatDocument !== prevDocument) {
      if (currentImages.length > 0) {
        activeImgName = currentImages[0].filePath;
      } else {
        activeImgName = null;
      }
      prevDocument = $whatDocument;
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

    const scaleX = (containerRect.width - 4) / imageNaturalWidth;
    const scaleY = (containerRect.height - 4) / imageNaturalHeight;

    minScale = Math.min(scaleX, scaleY);
    maxScale = minScale * 7;
    scale = minScale;
    scaleStep = (maxScale - minScale) / 15;

    const imageWidth = imageNaturalWidth * scale;
    const imageHeight = imageNaturalHeight * scale;

    translateX = (containerRect.width - 4 - imageWidth) / 2;
    translateY = (containerRect.height - 4 - imageHeight) / 2;

    updateTransform();
  }

  function handleImageLoad(event, imgName) {
    imageDimensions[imgName] = {
      width: event.target.naturalWidth,
      height: event.target.naturalHeight
    };
    
    // Если только что загрузилось изображение, которое выбрано прямо сейчас
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

      activeImgEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    });
  }

  function handleWheel(event) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
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

    const baseName = names[$whatDocument][0];
    const basePath = 'examples/save/';
    const fileInfo = await window.electron.findFileWithExtension(basePath, baseName);
    
    if (!fileInfo) {
      alert('Файл не найден.');
      return;
    }

    const { fullPath, extension } = fileInfo;
    const fileName = names[$whatDocument][1];

    const targetPath = await window.electron.saveDialog(fileName, extension);
    if (!targetPath) return;

    const result = await window.electron.saveFile(fullPath, targetPath);
    if (!result.success) {
      alert('Ошибка при сохранении файла: ' + result.error);
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
    <button class="close" on:click|stopPropagation={handleDelete}>✕</button>
    <button class="download" on:click|stopPropagation={handleDownload}></button>
    <button class="scale-up" on:click|stopPropagation={handleScaleUp}></button>
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
  /* Остальные стили без изменений */
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
  .scale-down {
    bottom: 0px;
    right: 25px;
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
    will-change: transform;
    user-select: none;
    pointer-events: none;
    transition: 0s;
    
    /* Скрываем все изображения по умолчанию */
    opacity: 0;
    visibility: hidden;
  }
  
  /* Отображаем только активное */
  .zoom-image.visible {
    opacity: 1;
    visibility: visible;
  }

  .nav-buttons-container {
    position: absolute;
    left: 0;
    bottom: 0;
    width: calc(100% - 70px);
    display: flex;
    box-sizing: border-box;
    overflow-x: auto;
  }

  :global(.nav-buttons-container button:first-child) {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }

  :global(.nav-buttons-container button:last-child) {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
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