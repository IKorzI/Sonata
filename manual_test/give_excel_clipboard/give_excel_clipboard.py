import os
import win32clipboard

def dump_clipboard_win32():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, 'copy.txt')

    # Открываем буфер обмена
    win32clipboard.OpenClipboard()
    try:
        formats = []
        fmt = 0
        # Собираем ID всех форматов, которые сейчас лежат в буфере
        while True:
            fmt = win32clipboard.EnumClipboardFormats(fmt)
            if fmt == 0:
                break
            formats.append(fmt)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"Найдено {len(formats)} форматов в буфере обмена:\n")
            f.write("=" * 50 + "\n\n")

            for fmt in formats:
                # Пытаемся получить человекочитаемое имя формата (например, "HTML Format" или "Rich Text Format")
                try:
                    format_name = win32clipboard.GetClipboardFormatName(fmt)
                except Exception:
                    format_name = f"Стандартный формат Windows (ID: {fmt})"

                f.write(f"[{format_name}]\n")
                f.write("-" * 50 + "\n")

                try:
                    # Извлекаем данные
                    data = win32clipboard.GetClipboardData(fmt)
                    
                    if isinstance(data, bytes):
                        # Если это байты, пробуем превратить их в текст
                        try:
                            f.write(data.decode('utf-8'))
                        except UnicodeDecodeError:
                            f.write(repr(data)) # Если текст не читается (например, картинка), пишем как есть
                    else:
                        f.write(str(data))
                except Exception as e:
                    f.write(f"[Не удалось прочитать данные: этот формат требует специфичной обработки. Ошибка: {e}]\n")
                    
                f.write("\n\n" + "=" * 50 + "\n\n")

        print(f"Успех! Дамп буфера обмена сохранен в:\n{file_path}")
        
    finally:
        # КРИТИЧЕСКИ ВАЖНО: всегда закрывать буфер, иначе другие программы (и вы сами) не смогут ничего скопировать!
        win32clipboard.CloseClipboard()

if __name__ == "__main__":
    dump_clipboard_win32()