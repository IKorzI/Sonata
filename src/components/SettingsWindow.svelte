<script>
  import { settings, lng, handleInput } from "../lib/store.js";

  let _lng = {};
  lng.subscribe((value) => (_lng = value));

  let eHeadName, headName;
  let ePercentage, percentageOfScholarship;
  let eSemesterStart, semesterStart, eSemesterEnd, semesterEnd;


  function handlerClickOK() {
    settings.set(false);
  }

  function handleClose() {
    settings.set(false);
  }
</script>

<div class="settings-area" class:showed={$settings}>
  <div class="settings-window" class:showed={$settings}>
    <div class="title">{_lng.settings.title}</div>
    <button class="close" on:click={handleClose}>✕</button>
    <div class="text-area">

      <div class="head-name">
        <div>{_lng.settings.headName}</div>
        <input
          type="text"
          bind:this={eHeadName}
          bind:value={headName}
          on:input={(e) => handleInput(e.target, { letters: true, spaces: true })}
        />
      </div>

      <div class="percentage-of-scholarship">
        <div>{_lng.settings.percentage}</div>
        <input
          type="text"
          bind:this={ePercentage}
          bind:value={percentageOfScholarship}
          on:input={(e) => handleInput(e.target, { numbers: true, maxNumber: 100 })}
        />
      </div>

      <div class="data-block" id="semester-dates">
        <div class="label">{_lng.settings.semesterDates.label}</div>
        <div class="row" id="start">
          <div>{_lng.settings.semesterDates.start}</div>
          <input
            type="text"
            bind:this={eSemesterStart}
            value={semesterStart}
            on:input={(e) => handleInput(e.target, { letters: true, spaces: true })}
          />
        </div>
        <div class="row" id="end">
          <div>{_lng.settings.semesterDates.end}</div>
          <input
            type="text"
            bind:this={eSemesterEnd}
            value={semesterEnd}
            on:input={(e) => handleInput(e.target, { letters: true, spaces: true })}
          />
        </div>
      </div>
      
    </div>
    <button class="ok" on:click={handlerClickOK}>{_lng.settings.save}</button>
  </div>
</div>

<style>
  .settings-area {
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
  :global(.settings-area.showed) {
    z-index: 3;
    opacity: 1;
  }

  .settings-window {
    height: 450px;
    width: 650px;
    background-color: var(--ErrorArea-window-background-color);
    overflow: hidden;
    position: relative;
    border-width: 2px;
    transform: translateY(+20px);
    display: grid;
    grid-template-rows: 30px 1fr 30px;
    transition: transform 0.4s;
  }
  :global(.settings-area .settings-window.showed) {
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

  .close {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 28px;
    height: 28px;
    border-radius: 0px;
    border-top-right-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    background-color: transparent;
  }
  .close:hover {
    background-color: rgba(255, 59, 59, 0.9);
  }
  .close:active {
    background-color: rgba(255, 59, 59, 0.5);
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
    background-color: rgb(153, 153, 153);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
</style>
