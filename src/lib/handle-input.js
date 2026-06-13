import { tick } from 'svelte';

/**
 * Validates and sanitizes text based on parameters  
 * @export  
 * @param {string} text - text to validate  
 * @param {Object} [params] - validation parameters  
 * numbers = false - allow numbers  
 * minNumber = 0 - if numbers = true, the minimum allowed numeric value  
 * maxNumber = undefined - if numbers = true, the maximum allowed numeric value  
 * letters = false - allow letters  
 * period = false - allow periods  
 * comma = false - allow commas  
 * spaces = false - allow spaces  
 * date = false - allow dates (DD.MM.YYYY)  
 * future = false - if date = true, the date must be greater than today  
 * @return {string} - sanitized text
 */
export function textFilter(text, { 
  numbers = false,
  minNumber = 0,
  maxNumber = undefined,
  letters = false,
  period = false,
  comma = false,
  spaces = false,
  date = false,
  future = false
} = {}) {
  if (typeof text !== 'string') return '';

  if (date) {
    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    const match = text.trim().match(dateRegex);
    if (!match) return '';
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // In JS, months start from 0
    const year = parseInt(match[3], 10);
    const parsedDate = new Date(year, month, day);
    
    // Protection against invalid dates (e.g., February 31)
    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month || parsedDate.getDate() !== day) {
      return '';
    }
    
    if (future) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for accurate comparison of dates only
      parsedDate.setHours(0, 0, 0, 0);
      if (parsedDate <= today) return '';
    }
    return text.trim();
  }

  let allowedChars = '';
  if (numbers) allowedChars += '0-9';
  if (letters) allowedChars += 'a-zA-Zа-яёА-ЯЁіІїЇєЄґҐ'; 
  if (period)  allowedChars += '\\.';
  if (comma)   allowedChars += ',';
  if (spaces)  allowedChars += ' ';

  if (!allowedChars) return '';

  // Remove all characters that are not in the allowed list
  const regex = new RegExp(`[^${allowedChars}]`, 'g');
  let filteredText = text.replace(regex, '');

  if (numbers) {
    const onlyDigits = filteredText.replace(/[^0-9]/g, '');
    
    if (onlyDigits.length > 0) {
      const numericValue = parseInt(onlyDigits, 10);

      // Undo the last entered character if the maximum is exceeded
      if (maxNumber !== undefined && numericValue > maxNumber) {
        return filteredText.slice(0, -1); 
      }
      
      // Check the minimum only if a sufficient number of digits has been entered
      if (minNumber !== undefined && numericValue < minNumber) {
        if (onlyDigits.length >= String(minNumber).length) {
          return filteredText.slice(0, -1);
        }
      }
    } else if (minNumber !== undefined || maxNumber !== undefined) {
      return '';
    }
  }

  return filteredText;
}

/**
 * Handles field input by applying textFilter and adjusts cursor position  
 * @export  
 * @param {Object} input - input element to be processed  
 * @param {Object} [params] - validation parameters  
 * numbers = false - allow numbers  
 * minNumber = 0 - if numbers = true, the minimum allowed numeric value  
 * maxNumber = undefined - if numbers = true, the maximum allowed numeric value  
 * letters = false - allow letters  
 * period = false - allow periods  
 * comma = false - allow commas  
 * spaces = false - allow spaces  
 * date = false - allow dates (DD.MM.YYYY)  
 * future = false - if date = true, the date must be greater than today
 */
export async function handleInput(input, params) {
  const cursorStart = input.selectionStart;
  const originalValue = input.value;
  
  const cleanValue = textFilter(originalValue, params);
  input.value = cleanValue;

  // Adjust cursor position by the number of deleted (invalid) characters
  const diff = originalValue.length - cleanValue.length;
  const newCursorPos = Math.max(0, cursorStart - diff); 

  // Wait for the DOM update from Svelte so the cursor doesn't jump to the end of the line
  await tick();
  
  input.setSelectionRange(newCursorPos, newCursorPos);
}

export function strToDate(str) {
  const [day, month, year] = str.split('.').map(Number);
  return new Date(year, month - 1, day); // month - 1 due to zero-based month indexing
}