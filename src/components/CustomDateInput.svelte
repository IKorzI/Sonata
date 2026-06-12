<script>
    import { tick } from 'svelte';

    export let value = "";
    
    let className = '';
    export { className as class };
    
    let inputEl;
    let prevPos = 0;

    // Получаем текущий сегмент по позиции курсора
    function getSegment(pos) {
        if (pos <= 2) return 'day';
        if (pos <= 5) return 'month';
        return 'year';
    }

    // Нормализация даты
    function normalizeDateStr(str) {
        if (!str || str.length !== 10) return str;
        let parts = str.split('.');
        if (parts.length !== 3) return str;
        
        let d = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        let y = parseInt(parts[2], 10);

        // Если год введен как 0012 (меньше 1000) и не равен строго 0, ставим текущий год
        if (y < 1000 && y !== 0) {
            y = new Date().getFullYear();
        }

        // Нормализация месяца
        if (m > 12) m = 12;
        
        // Нормализация дня (в зависимости от месяца и года)
        let maxDays = 31;
        if (m >= 1 && m <= 12) {
            // Если год 0000, используем високосный год (например 2024) для корректной работы 29 февраля
            let tempY = y === 0 ? 2024 : y;
            maxDays = new Date(tempY, m, 0).getDate();
        }
        if (d > maxDays) d = maxDays;

        // Функция добивки нулями
        const p = (num, len) => isNaN(num) ? '0'.repeat(len) : num.toString().padStart(len, '0');
        return `${p(d, 2)}.${p(m, 2)}.${p(y, 4)}`;
    }

    // ИСПРАВЛЕНИЕ 3: Выделение текста только при получении фокуса
    async function handleFocus() {
        if (!value) {
            const now = new Date();
            const d = String(now.getDate()).padStart(2, '0');
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const y = now.getFullYear();
            value = `${d}.${m}.${y}`;
        }
        await tick();
        inputEl.select(); // Выделяем весь текст
        prevPos = inputEl.selectionStart;
    }

    // Обработка нажатий на клавиатуру
    async function handleKeyDown(e) {
        if (e.key === 'Tab' || e.metaKey || e.ctrlKey) return;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;

        e.preventDefault();

        let start = inputEl.selectionStart;
        let end = inputEl.selectionEnd;

        // ИСПРАВЛЕНИЕ 1: Сброс курсора в начало при удалении всего выделенного текста
        if ((e.key === 'Backspace' || e.key === 'Delete') && start === 0 && end === value.length) {
            value = "00.00.0000";
            await tick();
            inputEl.setSelectionRange(0, 0); 
            prevPos = 0;
            return;
        }

        if (e.key === 'Backspace') {
            if (start > 0) {
                if (value[start - 1] === '.') start--;
                start--;
                let arr = value.split('');
                arr[start] = '0';
                value = arr.join('');
                await tick();
                inputEl.setSelectionRange(start, start);
                prevPos = start;
            }
            return;
        }

        if (e.key === 'Delete') {
            if (start < value.length) {
                if (value[start] === '.') start++;
                let arr = value.split('');
                arr[start] = '0';
                value = arr.join('');
                await tick();
                inputEl.setSelectionRange(start + 1, start + 1);
                prevPos = start + 1;
            }
            return;
        }

        // Логика ввода цифр
        if (/^\d$/.test(e.key)) {
            if (!value) value = "00.00.0000";
            
            if (start === 0 && end === value.length) {
                value = "00.00.0000";
                end = 0;
            }

            if (start < 10) {
                if (start === 2 || start === 5) start++; 
                let arr = value.split('');
                arr[start] = e.key; 
                value = arr.join('');
                
                let nextPos = start + 1;
                let jumpedOverDot = false;
                
                // Автоматический перескок
                if (nextPos === 2 || nextPos === 5) {
                    nextPos++;
                    jumpedOverDot = true;
                }
                
                // ИСПРАВЛЕНИЕ 4: Моментальная нормализация, если при вводе произошел перескок сегмента
                if (jumpedOverDot) {
                    value = normalizeDateStr(value);
                }

                await tick();
                inputEl.setSelectionRange(nextPos, nextPos);
                prevPos = nextPos; // Обновляем prevPos, чтобы keyUp не вызвал лишних перерисовок
            }
        }
    }

    // Проверка перемещения курсора
    async function handleKeyUp(e) {
        let currentPos = inputEl.selectionStart;

        // ИСПРАВЛЕНИЕ 2: Перепрыгивание точки при управлении стрелками
        if (e.key === 'ArrowRight') {
            if (currentPos === 2 || currentPos === 5) {
                currentPos++;
                inputEl.setSelectionRange(currentPos, currentPos);
            }
        } else if (e.key === 'ArrowLeft') {
            if (currentPos === 2 || currentPos === 5) {
                currentPos--;
                inputEl.setSelectionRange(currentPos, currentPos);
            }
        }

        let currentSegment = getSegment(currentPos);
        let prevSegment = getSegment(prevPos);
        
        // Если сегмент изменился, нормализируем
        if (currentSegment !== prevSegment) {
            value = normalizeDateStr(value);
            await tick();
            inputEl.setSelectionRange(currentPos, currentPos);
        }
        
        prevPos = currentPos;
    }

    // Нормализация при потере фокуса
    function handleBlur() {
        if (value && value !== "00.00.0000") {
            value = normalizeDateStr(value);
        }
    }
</script>

<input 
    type="text" 
    bind:this={inputEl}
    {value}
    on:focus={handleFocus}
    on:keydown={handleKeyDown}
    on:keyup={handleKeyUp}
    on:blur={handleBlur}
    class={className}
/>

<style>
  
</style>