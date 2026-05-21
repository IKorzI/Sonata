<script>
  import { onMount } from 'svelte';
  import { selectedSection } from '../lib/store.js'
  import SectionButton from './SectionButton.svelte';
  let choiceMark;
  selectedSection.set('');

  function selectSection(event) {
    const { id, parentId } = event.detail;
    const button = document.querySelector(`.program-menu #${parentId} #${id}`);
    moveChoiceMark(button);
    selectedSection.set(`${parentId}--${id}`);
  }

  function moveChoiceMark(button) {
    if (parseInt(choiceMark.style.top) < button.offsetTop) {
      choiceMark.style.height = (button.offsetTop + 18 - parseInt(choiceMark.style.top)) + 'px';
      setTimeout(() => {
        choiceMark.style.top = button.offsetTop - 3 + 'px';
        choiceMark.style.height = '21px';
      }, 200);
    } else if (parseInt(choiceMark.style.top) > button.offsetTop) {
      choiceMark.style.height = (parseInt(choiceMark.style.top) - button.offsetTop + 24) + 'px';
      choiceMark.style.top = button.offsetTop - 3 + 'px';
      setTimeout(() => {
        choiceMark.style.height = '21px';
      }, 200);
    }
  }

  onMount(() => {
    choiceMark = document.querySelector(`.program-menu .choice-mark`);
    choiceMark.style.top = '23px';
    choiceMark.style.height = '21px';
  });
</script>

<div class="program-menu" >
  <div class="choice-mark" class:hidden={$selectedSection === ''}/>

  <div class="section-list">

    <div class="group-of-sections" id="session">
      <div class="line-with-text">
        <span class="section-title">Сесія</span>
      </div>
      <SectionButton on:sectionclick={selectSection} id="package-of-documents" text="Пакет документів" />
      <SectionButton on:sectionclick={selectSection} id="empty-statements" text="Порожні відомості" />
      <SectionButton on:sectionclick={selectSection} id="report" text="Звіт за семестр" />
      <SectionButton on:sectionclick={selectSection} id="debtors" text="Боржники" />
    </div>

    <div class="group-of-sections" id="hours">
      <div class="line-with-text">
        <span class="section-title">Години</span>
      </div>
      <SectionButton on:sectionclick={selectSection} id="based-on-the-first-month" text="На основі І-го місяця" />
      <SectionButton on:sectionclick={selectSection} id="summary-of-teachers" text="По викладачам" />
    </div>

    <div class="group-of-sections" id="other">
      <div class="line-with-text">
        <span class="section-title">Інше</span>
      </div>
      <SectionButton on:sectionclick={selectSection} id="templates" text="Шаблони документів" />
      <SectionButton on:sectionclick={selectSection} id="other" text="Інше"/>
    </div>

  </div>

</div>

<style>
  
  .choice-mark {
    position: absolute;
    width: 3px;
    height: 30px;
    margin-top: 5px;
    border-radius: 10px;
    background-color: var(--choiceMark-color);
    transition: 0.2s;
  }

  .line-with-text {
    display: flex;
    align-items: center;
    width: 100%;
    margin-bottom: 5px;
  }

  .line-with-text span {
    padding: 0 7px;
    position: relative;
    z-index: 1;
    white-space: nowrap;
  }

  .line-with-text::before,
  .line-with-text::after {
    content: "";
    flex: 1;
    height: 2px;
    background: rgb(153, 153, 153);
    border-radius: 2px;
  }

  .line-with-text::before { margin-left: 4px }
  .line-with-text::after { margin-right: 4px }

  .program-menu {
    position: relative;
    width: 200px;
    height: calc(100% - 40px);
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    box-sizing: border-box;
    padding-left: 5px;
    transform: translateY(+13px);
  }

  .section-list {
    padding-left: 8px;
  }

  .group-of-sections {
    width: 100%;
  }

  .hidden {
    opacity: 0;
  }

</style>