<script>
    import { tick } from 'svelte';

    export let value = "";
    
    let className = '';
    export { className as class };
    
    let inputEl;
    let prevPos = 0;

    function getSegment(pos) {
        if (pos <= 2) return 'day';
        if (pos <= 5) return 'month';
        return 'year';
    }

    function normalizeDateStr(str) {
        if (!str || str.length !== 10) return str;
        let parts = str.split('.');
        if (parts.length !== 3) return str;
        
        let d = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        let y = parseInt(parts[2], 10);

        if (y < 1000 && y !== 0) {
            y = new Date().getFullYear();
        }

        if (m > 12) m = 12;
        
        let maxDays = 31;
        if (m >= 1 && m <= 12) {
            // Use 2024 (a leap year) as a temporary year, [cite: 8]
            // to allow entering February 29 before the user enters the real year [cite: 8]
            let tempY = y === 0 ?
                2024 : y;
            maxDays = new Date(tempY, m, 0).getDate();
        }
        if (d > maxDays) d = maxDays;
        const p = (num, len) => isNaN(num) ? '0'.repeat(len) : num.toString().padStart(len, '0');
        return `${p(d, 2)}.${p(m, 2)}.${p(y, 4)}`;
    }

    async function handleFocus() {
        if (!value) {
            const now = new Date();
            const d = String(now.getDate()).padStart(2, '0');
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const y = now.getFullYear();
            value = `${d}.${m}.${y}`;
        }
        await tick();
        inputEl.select();
        prevPos = inputEl.selectionStart;
    }

    async function handleKeyDown(e) {
        if (e.key === 'Tab' || e.metaKey || e.ctrlKey) return;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;

        e.preventDefault();

        let start = inputEl.selectionStart;
        let end = inputEl.selectionEnd;
        // Handling the complete clearing of the field when all text is selected (e.g., via Ctrl+A) [cite: 16]
        if ((e.key === 'Backspace' || e.key === 'Delete') && start === 0 && end === value.length) {
            value = "00.00.0000";
            await tick();
            inputEl.setSelectionRange(0, 0); 
            prevPos = 0;
            return;
        }

        if (e.key === 'Backspace') {
            if (start > 0) {
                // If there is a dot before the caret — jump over it [cite: 17]
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
                // If the caret is before a dot — jump over it to delete the next digit [cite: 20]
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

        if (/^\d$/.test(e.key)) {
            if (!value) value = "00.00.0000";
            if (start === 0 && end === value.length) {
                value = "00.00.0000";
                end = 0;
            }

            if (start < 10) {
                // Automatically jump over the separator during input [cite: 25]
                if (start === 2 || start === 5) start++;
                let arr = value.split('');
                arr[start] = e.key; 
                value = arr.join('');
                
                let nextPos = start + 1;
                let jumpedOverDot = false;
                if (nextPos === 2 || nextPos === 5) {
                    nextPos++;
                    jumpedOverDot = true;
                }
                
                // Normalize the value only when the input of one of the segments is completely finished [cite: 28]
                if (jumpedOverDot) {
                    value = normalizeDateStr(value);
                }

                await tick();
                inputEl.setSelectionRange(nextPos, nextPos);
                prevPos = nextPos;
            }
        }
    }

    async function handleKeyUp(e) {
        let currentPos = inputEl.selectionStart;
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
        
        // Date validation occurs during the transition between segments (e.g., using arrows) [cite: 34]
        if (currentSegment !== prevSegment) {
            value = normalizeDateStr(value);
            await tick();
            inputEl.setSelectionRange(currentPos, currentPos);
        }
        
        prevPos = currentPos;
    }

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