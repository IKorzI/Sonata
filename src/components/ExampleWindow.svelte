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
    "hours--based-on-the-first-month--hours": ["hours", "Години"],
    "hours--summary-of-teachers--hours": ["hours", "Години"],
    "session--empty-statements--contingent": ["contingent", "Контингент"],
    "session--empty-statements--hours": ["hours", "Години"],
    "session--package-of-documents--statements": ["statements", "Відомості"],
    "session--report--statements": ["statements", "Відомості"],
    "session--debtors--statements": ["statements", "Відомості"]
  }

  // Получаем массив только уникальных имен файлов (hours, contingent, statements)
  const uniqueImageNames = [...new Set(Object.values(names).map(v => v[0]))];

  // Реактивная переменная для текущего активного имени файла
  $: activeImgName = $whatDocument && names[$whatDocument] ? names[$whatDocument][0] : null;

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
</style>