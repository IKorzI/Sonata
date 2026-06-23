<script>
  import { about, lng } from "../lib/store.js";

  let _lng = {};
  lng.subscribe((value) => (_lng = value));

  const authorsList = [
    {
      url: "https://www.magnific.com/icon/verify_6270466",
      author: "Rizki Ahmad Fauzi",
      imageName: { ru: "«Удачно»", uk: "«Вдало»", en: '"Successful"' },
    },
    {
      url: "https://www.flaticon.com/free-icon/documents_666701",
      author: "Vitaly Gorbachev",
      imageName: {
        ru: "«Пакет документов»",
        uk: "«Пакет документів»",
        en: '"Package of documents"',
      },
    },
    {
      url: "https://www.magnific.com/icon/story-telling_8253764",
      author: "Talha Dogar",
      imageName: {
        ru: "«Пустые ведомости»",
        uk: "«Порожні відомості»",
        en: '"Empty statements"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/report_3029316?related_id=3029337&origin=search",
      author: "catkuro",
      imageName: {
        ru: "«Отчет за семестр»",
        uk: "«Звіт за семестр»",
        en: '"Report"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/contract_5692245",
      author: "Freepik",
      imageName: {
        ru: "«Должники»",
        uk: "«Боржники»",
        en: '"Debtors"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/document_8964973?related_id=8964905&origin=search",
      author: "Talha Dogar",
      imageName: {
        ru: "«На основе I-го місяця»",
        uk: "«На основі I-го місяця»",
        en: '"Based on 1st month"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/planner_15688913",
      author: "Freepik",
      imageName: {
        ru: "«По преподавателям»",
        uk: "«По викладачам»",
        en: '"By teachers"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/docs_281760",
      author: "Freepik",
      imageName: {
        ru: "«Шаблоны»",
        uk: "«Шаблони документів»",
        en: '"Document templates"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/other_7245102",
      author: "sonnycandra",
      imageName: {
        ru: "«Другое»",
        uk: "«Інше»",
        en: '"Other"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon-font/cross-small_3917195",
      author: "Flaticon",
      imageName: {
        ru: "«Закрыть»",
        uk: "«Закрити»",
        en: '"Close"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/moon_865882",
      author: "Good Ware",
      imageName: {
        ru: "«Темная тема»",
        uk: "«Темна тема»",
        en: '"Dark theme"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/sun_702459",
      author: "Good Ware",
      imageName: {
        ru: "«Светлая тема»",
        uk: "«Світла тема»",
        en: '"Light theme"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/info_1445402",
      author: "Freepik",
      imageName: {
        ru: "«О приложении»",
        uk: "«Про додаток»",
        en: '"About the app"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon-font/cross-small_3917195",
      author: "Flaticon",
      imageName: {
        ru: "«Очистить»",
        uk: "«Очистити»",
        en: '"Clear"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/doubt_446110",
      author: "Freepik",
      imageName: {
        ru: "«Узнать»",
        uk: "«Дізнатися»",
        en: '"Find out"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/plus-sign_32339",
      author: "Freepik",
      imageName: {
        ru: "«Добавить»",
        uk: "«Додати»",
        en: '"Add"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/download-arrow_81500",
      author: "Freepik",
      imageName: {
        ru: "«Скачать»",
        uk: "«Скачати»",
        en: '"Download"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/edit_565317",
      author: "Google",
      imageName: {
        ru: "«Редактировать»",
        uk: "«Редагувати»",
        en: '"Edit"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/loading_6356630?term=loading&page=1&position=2&origin=search&related_id=6356630",
      author: "Krystsina Mikhailouskaya",
      imageName: {
        ru: "«В процессе»",
        uk: "«У процесі»",
        en: '"In process"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/resize_152358",
      author: "Freepik",
      imageName: {
        ru: "«По ширине»",
        uk: "«По ширині»",
        en: '"By width"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/minus-in-zoom-symbol_54696",
      author: "Catalin Fertu",
      imageName: {
        ru: "«Отдалить»",
        uk: "«Віддалити»",
        en: '"Zoom out"',
      },
    },
    {
      url: "https://www.flaticon.com/free-icon/zoom-increasing-symbol_54862",
      author: "Catalin Fertu",
      imageName: {
        ru: "«Приблизить»",
        uk: "«Наблизити»",
        en: '"Zoom in"',
      },
    },
    {
      url: "https://www.magnific.com/free-vector/simple-gradient-background-vector-winter-blue_16358990.htm",
      author: "rawpixel.com",
      imageName: {
        ru: "«Фон светлой темы»",
        uk: "«Фон світлої теми»",
        en: '"Light theme background"',
      },
    },
  ];

  function formatAuthorText(template, author, imageTranslations) {
    if (!template) return "";

    const currentLang = _lng.lng || "ru";

    const imageTranslated =
      imageTranslations && imageTranslations[currentLang]
        ? ` ${imageTranslations[currentLang]}`
        : "";

    return template
      .replace("{imageName}", imageTranslated)
      .replace("{autorName}", author);
  }

  function handleClose() {
    about.set(false);
  }
</script>

<div class="about-area" class:showed={$about}>
  <div class="about-window" class:showed={$about}>
    <div class="title">{_lng.about.title}</div>
    <button class="close" on:click={handleClose}>✕</button>
    <div class="text-area">
      <div class="program-icon"></div>
      <div class="program-name">
        <div class="program-icon"></div>
        <div class="text">onata</div>
      </div>
      <div class="description">
        {_lng.about.version} 1.0
        <a href="https://github.com/IKorzI/Sonata" target="_blank"
          >{_lng.about.gitHub}</a
        >
      </div>
      <div class="history">
        <p>{_lng.about.history}</p>
      </div>
      <div class="authors">
        <div class="title">{_lng.about.authors.title}</div>
        <div class="list">
          {#each authorsList as item}
            <a href={item.url} target="_blank">
              {formatAuthorText(
                _lng.about.authors.elementText,
                item.author,
                item.imageName,
              )}
            </a>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .about-area {
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
  .about-area.showed {
    z-index: 3;
    opacity: 1;
  }

  .about-window {
    height: 400px;
    width: 600px;
    background-color: var(--ErrorArea-window-background-color);
    overflow: hidden;
    position: relative;
    border-width: 2px;
    transform: translateY(+20px);
    display: grid;
    grid-template-rows: 30px 1fr;
    transition: transform 0.4s;
  }
  .about-area .about-window.showed {
    transform: translateY(0px);
  }

  .about-window > .title {
    display: grid;
    text-align: center;
    align-items: center;
    font-size: 20px;
    font-weight: bold;
    border-bottom-width: 2px;
    border-radius: 0px;
  }

  .text-area {
    position: relative;
    padding: 10px;
    overflow-y: auto;
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

  .program-icon {
    background-image: url("../icon2.png");
    background-repeat: no-repeat;
    background-position: center center;
  }

  .text-area > .program-icon {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 200px;
    height: 200px;
    background-size: 100px auto;
  }

  .program-name {
    position: absolute;
    top: 20px;
    left: 300px;
    height: 50px;
    width: 200px;
    display: flex;
    justify-content: center;
    align-items: end;
  }
  .program-name .program-icon {
    height: 60px;
    width: 28px;
    background-size: 28px auto;
  }
  .program-name .text {
    position: relative;
    font-size: 40px;
    top: 4px;
    margin-left: 3px;
  }

  .description {
    position: absolute;
    top: 75px;
    left: 250px;
    width: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .description a {
    cursor: pointer;
  }

  .history {
    position: absolute;
    top: 130px;
    left: 190px;
  }

  .history p {
    font-size: 16px;
    white-space: normal;
  }

  .authors {
    position: absolute;
    top: 235px;
    width: calc(100% - 10px);
    display: grid;
    grid-template-rows: 25px 1fr;
  }
  .authors * {
    font-size: 16px;
  }

  .authors .title {
    width: 100%;
  }

  .authors .list {
    display: flex;
    flex-direction: column;
    height: 90px;
    overflow-y: auto;
    width: 90%;
    border-radius: 0px;
    padding-left: 5px;
    background-color: var(--background-color);
  }
  .authors .list::-webkit-scrollbar {
    width: 8px;
  }
  .authors .list::-webkit-scrollbar-track {
    background: transparent;
  }
  .authors .list::-webkit-scrollbar-thumb {
    background-color: rgb(155, 155, 155);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: content-box;
    min-height: 50px;
  }
  .authors .list * {
    width: max-content;
    cursor: pointer;
  }
</style>
