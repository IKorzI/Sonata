<script>
  import { about } from "../lib/store.js";

  function handleClose() {
    about.set(false)
  }
</script>

<div
  class="about-area"
  class:showed={$about}
>
  <div
    class="about-window"
    class:showed={$about}
  >
    <div class="title">О приложении</div>
    <button class="close" on:click={handleClose}>✕</button>
    <div class="text-area">
      <div class="program-icon"></div>
      <div class="program-name">
        <div class="program-icon"></div>
        <div class="text">onata</div>
      </div>
      <div class="description">
        Версия 1.0
        <a href="https://github.com/IKorzI/Sonata" target="_blank">Страница проекта на GitHub</a>
      </div>
      <div class="history">
        <p>Приложение изначально создавалось как "А что, если ...?".</p>
        <p>Чем дальше заходила разработка, тем больше оно перерастало в полноценный проект.</p>
      </div>
      <div class="authors">
        <div class="title">В приложении используются изображения от следующих авторов:</div>
      </div>
    </div>
  </div>
</div>

<style>
  br {
    width: 0px;

  }
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
  }

</style>
