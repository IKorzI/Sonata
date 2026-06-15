import docx
import os

def get_all_runs(doc):
    """Собирает все run'ы из всех абзацев документа в один список."""
    runs = []
    for paragraph in doc.paragraphs:
        for run in paragraph.runs:
            runs.append(run)
    return runs

def main():
    # Укажите путь к вашему документу
    file_path = "document.docx" 
    
    if not os.path.exists(file_path):
        print(f"Файл '{file_path}' не найден. Пожалуйста, проверьте путь.")
        return

    # Загружаем документ
    doc = docx.Document(file_path)

    while True:
        # Каждый раз заново собираем run'ы, так как их количество 
        # могло измениться после удаления
        runs = get_all_runs(doc)
        
        print("\n" + "="*40)
        print("Список всех run'ов в документе:")
        print("="*40)
        
        # 1. Вывод пронумерованного списка текстов
        for i, run in enumerate(runs, start=1):
            # Заменяем переносы строк на пробелы для красивого вывода в консоль
            safe_text = run.text.replace('\n', '\\n') 
            print(f'[{i}] "{safe_text}"')
        
        print("-" * 40)
        print("Что вы хотите сделать?")
        print("1 - Удалить run")
        print("2 - Заменить текст в run'е")
        print("0 - Сохранить изменения и выйти")
        
        choice = input("\nВаш выбор: ").strip()

        if choice == '0':
            save_path = "updated_" + file_path
            doc.save(save_path)
            print(f"\nДокумент успешно сохранен как '{save_path}'. Работа завершена.")
            break
            
        elif choice == '1':
            # 2.2.1 Запрос номера для удаления
            user_input = input("Введите номер run'а, который нужно удалить: ")
            try:
                run_num = int(user_input)
                if 1 <= run_num <= len(runs):
                    run_to_delete = runs[run_num - 1]
                    # Полное удаление run'а из XML структуры документа
                    r_element = run_to_delete._element
                    r_element.getparent().remove(r_element)
                    print(f"\n[УСПЕХ] Run под номером {run_num} удален.")
                else:
                    print("\n[ОШИБКА] Run'а с таким номером не существует.")
            except ValueError:
                print("\n[ОШИБКА] Пожалуйста, введите число.")

        elif choice == '2':
            # 2.1.1 Запрос номера для замены текста
            user_input = input("Введите номер run'а, текст которого нужно заменить: ")
            try:
                run_num = int(user_input)
                if 1 <= run_num <= len(runs):
                    run_to_edit = runs[run_num - 1]
                    print(f"Текущий текст: '{run_to_edit.text}'")
                    
                    # 2.1.2 Запрос нового текста и замена
                    new_text = input("Введите новый текст: ")
                    run_to_edit.text = new_text
                    print(f"\n[УСПЕХ] Текст в run под номером {run_num} успешно заменен.")
                else:
                    print("\n[ОШИБКА] Run'а с таким номером не существует.")
            except ValueError:
                print("\n[ОШИБКА] Пожалуйста, введите число.")
                
        else:
            print("\n[ОШИБКА] Неизвестная команда. Пожалуйста, выберите 1, 2 или 0.")

if __name__ == "__main__":
    main()