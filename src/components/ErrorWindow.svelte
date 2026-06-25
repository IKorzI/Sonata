<script>
  import { message, lng } from "../lib/store.js";

  let errorText = "";
  let errorType = "";

  function getTranslation(dict, path) {
    if (!path) return "";
    return (
      path.split(".").reduce((acc, part) => acc && acc[part], dict) || path
    );
  }

  function parseBackendText(dict, text) {
    if (!text) return "";
    // Search and replace placeholders of the {{key.path}} format with the corresponding localized strings [cite: 5]
    return text.replace(/\{\{([a-zA-Z0-9_\.]+)\}\}/g, (match, key) => {
      const translated = getTranslation(dict, key);
      return translated && typeof translated !== "object" && translated !== key
        ? translated
        : match;
    });
  }

  $: if ($message) {
    const isMessageEmpty =
      $message.text === "" && !$message.params?.messageFromTheBackendData;
    if (isMessageEmpty) {
      // The delay before clearing the text allows the CSS fade-out animation to finish without abruptly cutting off the content [cite: 7]
      setTimeout(() => {
        errorText = "";
        errorType = "";
      }, 400);
    } else {
      errorType =
        $message.type === "warning"
          ? $lng.errorWindow.errorWindow.title.warning
          : $lng.errorWindow.errorWindow.title.error;
      if ($message.params?.messageFromTheBackendData) {
        const backendData = $message.params.messageFromTheBackendData;
        let combinedParts = [];
        // Separate formatting for file lists (e.g., during save conflicts in the workspace) [cite: 11]
        if (backendData.filesText) {
          const filesTitle = getTranslation(
            $lng,
            "workspace.saveWithADifferentName",
          );
          combinedParts.push(`${filesTitle}\n${backendData.filesText}`);
        }

        if (backendData.customText) {
          combinedParts.push(parseBackendText($lng, backendData.customText));
        }

        errorText = combinedParts.join("\n\n");
      } else {
        let text = getTranslation($lng, $message.text);
        if ($message.params) {
          // Dynamic substitution of parameters into the translation text (replacing templates like {paramName} with actual values) [cite: 15]
          for (const [key, value] of Object.entries($message.params)) {
            if (typeof value === "string" || typeof value === "number") {
              text = text.replace(new RegExp(`{${key}}`, "g"), value);
            }
          }
        }
        errorText = text;
      }
    }
  }

  function handlerClickOK() {
    message.set({ type: "", text: "" });
  }
</script>

<div
  class="error-window"
  class:showed={$message.text || $message.params?.messageFromTheBackendData}
>
  <div class="title">{errorType}</div>
  <div class="text-area">{errorText}</div>
  <button class="ok" on:click={handlerClickOK}>OK</button>
</div>

<style>
  .error-window {
    grid-area: 1 / 1;
    height: 250px;
    width: 450px;
    background-color: var(--ErrorArea-window-background-color);
    overflow: hidden;
    position: relative;
    border-width: 2px;
    transform: translateY(+20px);
    display: grid;
    z-index: 1;
    opacity: 0;
    pointer-events: none;
    grid-template-rows: 30px 1fr 30px;
    transition: 0.4s;
  }
  .error-window.showed {
    z-index: 2;
    opacity: 1;
    pointer-events: auto;
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

  .text-area::-webkit-scrollbar {
    width: 8px;
  }
  .text-area::-webkit-scrollbar-track {
    background: transparent;
  }
  .text-area::-webkit-scrollbar-thumb {
    background-color: var(--button-background-color);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  .text-area::-webkit-scrollbar-thumb:hover {
    background-color: var(--button-hover-background-color);
  }
</style>
