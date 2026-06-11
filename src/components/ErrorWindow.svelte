<script>
  import { message, lng } from '../lib/store.js'

  let _lng = {};
  lng.subscribe(value => (_lng = value));

  let errorText = '';
  let errorType = '';

  // Пошук звичайних перекладів у словнику за шляхом (наприклад, 'errorWindow.title')
  function getTranslation(dict, path) {
    if (!path) return '';
    return path.split('.').reduce((acc, part) => acc && acc[part], dict) || path;
  }

  // Парсинг тексту з бекенду: пошук та переклад ключів у форматі {{key}}
  function parseBackendText(dict, text) {
    if (!text) return '';
    return text.replace(/\{\{([a-zA-Z0-9_\.]+)\}\}/g, (match, key) => {
      const translated = getTranslation(dict, key);
      // Якщо переклад знайдено і це рядок (а не гілка об'єкта), повертаємо його. Інакше — оригінальний {{key}}
      return (translated && typeof translated !== 'object' && translated !== key) ? translated : match;
    });
  }

  // Відслідковування змін у повідомленнях або мові
  $: if ($message) {
    // Повідомлення валідне, якщо є звичайний text або повідомлення від бекенду
    const isMessageEmpty = $message.text === '' && !$message.params?.messageFromTheBackendData;

    if (isMessageEmpty) {
      setTimeout(() => {
        errorText = '';
        errorType = '';
      }, 400);
    } else {
      errorType = $message.type === 'warning' 
        ? $lng.errorWindow.errorWindow.title.warning 
        : $lng.errorWindow.errorWindow.title.error;

      // Сценарій А: Складні дані від бекенду
      if ($message.params?.messageFromTheBackendData) {
        const backendData = $message.params.messageFromTheBackendData;
        let combinedParts = [];

        if (backendData.filesText) {
          const filesTitle = getTranslation($lng, 'workspace.saveWithADifferentName');
          combinedParts.push(`${filesTitle}\n${backendData.filesText}`);
        }

        if (backendData.customText) {
          combinedParts.push(parseBackendText($lng, backendData.customText));
        }

        errorText = combinedParts.join('\n\n');

      // Сценарій Б: Стандартне повідомлення з підстановкою параметрів (наприклад, {notFoundSubjects})
      } else {
        let text = getTranslation($lng, $message.text);

        if ($message.params) {
          for (const [key, value] of Object.entries($message.params)) {
            if (typeof value === 'string' || typeof value === 'number') {
              text = text.replace(new RegExp(`{${key}}`, 'g'), value);
            }
          }
        }
        errorText = text;
      }
    }
  }

  function handlerClickOK() {
    message.set({type: '', text: ''});
  }

</script>

<div class='error-area' class:showed={$message.text || $message.params?.messageFromTheBackendData}>
  
  <div class='error-window' class:showed={$message.text || $message.params?.messageFromTheBackendData}>
    <div class='title'>{errorType}</div>
    <div class='text-area'>{errorText}</div>
    <button class='ok' on:click={handlerClickOK}>OK</button>
  </div>

</div>

<style>

  .error-area {
    position: absolute;
    top: 27px;
    left: 0;
    height: calc(100% - 27px);
    width: 100%;
    background-color: var(--ErrorArea-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    z-index: -1;
    transition: 0.4s;
    border-radius: 0px;
  }
  :global(.error-area.showed) {
    z-index: 3;
    opacity: 1;
  }

  .error-window {
    height: 250px;
    width: 450px;
    background-color: var(--ErrorArea-window-background-color);
    overflow: hidden;
    position: relative;
    border-width: 2px;
    transform: translateY(+20px);
    display: grid;
    grid-template-rows: 30px 1fr 30px;
    transition: transform 0.4s;
  }
  :global(.error-area .error-window.showed) {
    transform: translateY(0px);
  }

  .title {
    display: grid;
    text-align: center;
    align-items: center;
    font-size: 20px;
    font-weight: bold;
    border-bottom-width: 2px;
    border-radius: 0px;
  }

  .text-area {
    padding: 10px;
    overflow-y: auto;
    white-space: pre-wrap;
  }

  .ok {
    display: grid;
    text-align: center;
    align-items: center;
    font-size: 20px;
    border-radius: 0px;
    border-top-width: 2px;
    cursor: pointer;
  }

  /* Стилізація скроллбару */
  .text-area::-webkit-scrollbar {
    width: 8px;
  }
  .text-area::-webkit-scrollbar-track {
    background: transparent;
  }
  .text-area::-webkit-scrollbar-thumb {
    background-color: var(--button-background-color1);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  .text-area::-webkit-scrollbar-thumb:hover {
    background-color: var(--button-hover-background-color1);
  }

</style>