<script>
  import { onMount } from "svelte";
  import { selectedSection, lng } from "../lib/store.js";
  import SectionButton from "./SectionButton.svelte";
  let _lng = {};
  lng.subscribe((value) => (_lng = value));

  let choiceMark,
    choiseMarkIsVisible = false;

  selectedSection.set("");
  function selectSection(event) {
    const { id, parentId } = event.detail;
    const button = document.querySelector(`.app-menu #${parentId} #${id}`);

    moveChoiceMark(button);
    selectedSection.set(`${parentId}--${id}`);
  }

  function moveChoiceMark(button) {
    if (!choiseMarkIsVisible) {
      choiceMark.style.top = button.offsetTop - 3 + "px";
      choiceMark.style.height = "21px";
      choiceMark.style.zIndex = "1";

      // A micro-delay allows the browser to apply the initial positions (top, height) before enabling the transition for a smooth appearance
      setTimeout(() => {
        choiceMark.style.transition = "0.2s";
        choiceMark.style.opacity = "1";
      }, 10);
      choiseMarkIsVisible = true;
    } else {
      if (parseInt(choiceMark.style.top) < button.offsetTop) {
        // Downward movement animation: first, we stretch the height of the marker so that it reaches the new button...
        choiceMark.style.height =
          button.offsetTop + 18 - parseInt(choiceMark.style.top) + "px";
        // ...and after 200ms (the duration of the CSS transition itself), we "pull up" its top part and restore the standard height
        setTimeout(() => {
          choiceMark.style.top = button.offsetTop - 3 + "px";
          choiceMark.style.height = "21px";
        }, 200);
      } else if (parseInt(choiceMark.style.top) > button.offsetTop) {
        // Upward movement animation: we instantly move the top edge to the new button, stretching the marker down to its previous position...
        choiceMark.style.height =
          parseInt(choiceMark.style.top) - button.offsetTop + 24 + "px";
        choiceMark.style.top = button.offsetTop - 3 + "px";

        // ...and after 200ms, we compress it to the standard size
        setTimeout(() => {
          choiceMark.style.height = "21px";
        }, 200);
      }
    }
  }

  onMount(() => {
    choiceMark = document.querySelector(`.app-menu .choice-mark`);
    choiceMark.style.top = "23px";
    choiceMark.style.height = "21px";
  });
</script>

<div class="app-menu">
  <div class="choice-mark" />

  <div class="section-list">
    <div class="group-of-sections" id="session">
      <div class="line-with-text">
        <span class="section-title">{_lng?.appMenu.session.sectionTitle}</span>
      </div>
      <SectionButton
        on:sectionclick={selectSection}
        id="package-of-documents"
        text={_lng?.appMenu.session.packageOfDocuments}
      />
      <SectionButton
        on:sectionclick={selectSection}
        id="empty-statements"
        text={_lng?.appMenu.session.emptyStatements}
      />
      <SectionButton
        on:sectionclick={selectSection}
        id="report"
        text={_lng?.appMenu.session.report}
      />
      <SectionButton
        on:sectionclick={selectSection}
        id="debtors"
        text={_lng?.appMenu.session.debtors}
      />
    </div>

    <div class="group-of-sections" id="hours">
      <div class="line-with-text">
        <span class="section-title">{_lng?.appMenu.hours.sectionTitle}</span>
      </div>
      <SectionButton
        on:sectionclick={selectSection}
        id="based-on-the-first-month"
        text={_lng?.appMenu.hours.basedOnTheFirstMonth}
      />
      <SectionButton
        on:sectionclick={selectSection}
        id="summary-of-teachers"
        text={_lng?.appMenu.hours.summaryOfTeachers}
      />
    </div>

    <div class="group-of-sections" id="other">
      <div class="line-with-text">
        <span class="section-title">{_lng?.appMenu.other.sectionTitle}</span>
      </div>
      <SectionButton
        on:sectionclick={selectSection}
        id="templates"
        text={_lng?.appMenu.other.templates}
      />
      <SectionButton
        on:sectionclick={selectSection}
        id="other"
        text={_lng?.appMenu.other.other}
      />
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
    transition: 0s;
    opacity: 0;
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
    background: var(--line-with-text-color);
    border-radius: 2px;
  }

  .line-with-text::before {
    margin-left: 4px;
  }
  .line-with-text::after {
    margin-right: 4px;
  }

  .app-menu {
    position: relative;
    width: 210px;
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
</style>
