<script>
  import { onMount, onDestroy } from 'svelte';
  import { whatDocument } from '../lib/store.js'
  export let type;
  export let eId;

  const label = {
    "session--package-of-documents--statements": "Зведені відомості",
    "session--empty-statements--hours": "Години по групах за місяць",
    "session--empty-statements--contingent": "Контингент",

    "hours--based-on-the-first-month--hours": "Години по групах за перший місяць семестра",
    "hours--summary-of-teachers--hours": "Години по групах"
  }

  const names = {
    "session--package-of-documents--statements": "Відомості"
  }

  let eArea;

  // Путь к изображению по типу
  $: backgroundImageUrl =
    type === 'excel' ? 'excel.png'
    : type === 'word' ? 'word.png'
    : '';

  async function handleDownload() {
    if (!window.electron) return;

    const baseName = eId;
    const basePath = 'examples/save/';

    // ✅ Получаем расширение от Electron (поиск файла с этим базовым именем в папке examples)
    const fileInfo = await window.electron.findFileWithExtension(basePath, baseName);
    if (!fileInfo) {
      alert('Файл не найден.');
      return;
    }

    const { fullPath, extension } = fileInfo;

    const fileName = names[baseName]

    // ✅ Открываем диалог сохранения
    const targetPath = await window.electron.saveDialog(fileName, extension);
    if (!targetPath) return;

    // ✅ Копируем файл
    const result = await window.electron.saveFile(fullPath, targetPath);

    if (!result.success) {
      alert('Ошибка при сохранении файла: ' + result.error);
    }
  }

  function handleWhat() {
    whatDocument.set(eId)
  }

  onMount(() => {
    let mouseCounter = 0;

    eArea.addEventListener('mouseenter', (e) => {
      mouseCounter++;
      eArea.classList.add('hovered');
    });

    eArea.addEventListener('mouseleave', (e) => {
      setTimeout(() => {
        mouseCounter--;
        if (mouseCounter <= 0) {
          mouseCounter = 0;
          eArea.classList.remove('hovered');
        }
      }, 10)
    });
  });

  onDestroy(() => {
    eArea.removeEventListener('mouseenter');
    eArea.removeEventListener('mouseleave');
  });

</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

<div
  class="file-output"
  id={eId}
>

  <div class="label">{label[eId]}</div>

  <div class="area"
    on:click={handleDownload}
    bind:this={eArea}
  >
    <div class="text">Натисніть для збереження файлу</div>
    <div class="img" style:background-image={`url(${backgroundImageUrl})`}></div>
    <div class="what" on:click|stopPropagation={handleWhat}></div>
  </div>
</div>

<style>
  .area, .area * {
    cursor: pointer;
  }

  .file-output {
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
  :global(.area.hovered) {
    background-color: var(--button-background-color);
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
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
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

  .what {
    position: absolute;
    top: 130px;
    width: 30px;
    height: 30px;
    background-image: var(--inputFile-what-background-image);
    border-radius: 999px;
  }
  .what:hover {
    background-color: var(--button-hover-background-color);
  }
  .what:active {
    background-color: var(--button-active-background-color);
  }

</style>
