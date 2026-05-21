import json
import sys
import re
import os

from session import session_PackageOfDocuments, session_EmptyStart, session_ReportStart, session_DebtorsStart
from hours import hours_BasedOnTheFirstMonth, hours_SummaryOfTeachers
from other import extend_image, other_NumDenStart

def test_save_info(info):
    # Определяем путь: берем папку, где лежит сам скрипт, и добавляем имя файла
    file_path = os.path.join(os.path.dirname(__file__), 'data.json')

    # Записываем данные в файл
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            # indent=4 делает файл читаемым для человека
            # ensure_ascii=False позволяет сохранять кириллицу корректно
            json.dump(info, f, indent=4, ensure_ascii=False)
        
        print(f"Файл успешно сохранен по адресу: {file_path}")
    except Exception as e:
        print(f"Произошла ошибка при сохранении: {e}")

def camel_to_snake(name):
    """
    Переводит строку из camelCase в snake_case.
    Добавлено исключение: если строка пустая или начинается не с английской буквы, 
    возвращаем ее без изменений.
    """
    if not name:
        return name

    # НОВОЕ: Проверка на первый символ (должен быть английской буквой)
    if not re.match(r'^[a-zA-Z]', name):
        return name

    # Если строка состоит только из заглавных букв и цифр (например, "C5", "ID"), 
    # оставляем её без изменений
    if re.match(r'^[A-Z0-9]+$', name):
        return name
        
    # 1. Отделяем строчные от заглавных (nameZXC -> name_ZXC, sAnd -> s_And)
    name = re.sub(r'([a-z])([A-Z])', r'\1_\2', name)
    
    # 2. Отделяем строчные от цифр (name123 -> name_123, ZXs1 -> ZXs_1)
    name = re.sub(r'([a-z])([0-9])', r'\1_\2', name)
    
    # 3. Отделяем цифры от заглавных (например, ZX1And -> ZX1_And)
    name = re.sub(r'([0-9])([A-Z])', r'\1_\2', name)
    
    # 4. Разделяем склеенные аббревиатуры и новые слова (ZXCv -> ZX_Cv)
    # Исключение: мы НЕ разделяем, если новое слово — это ровно одна буква 's' (ZXCs)
    name = re.sub(r'([A-Z]+)([A-Z][a-z]{2,}|[A-Z][a-rt-z])', r'\1_\2', name)
    
    # Разбиваем строку по '_' и применяем правила сохранения регистра
    parts = name.split('_')
    processed_parts = []
    
    for part in parts:
        if not part:
            continue
            
        # Правило 2.2 и 1.1: Сохраняем регистр для аббревиатур и связок с цифрами
        if part.isupper() and len(part) >= 2:
            processed_parts.append(part)
            
        # Правило 1.3 и 2.4: Серия заглавных букв и 's' на конце (ZXCs, ZX1s)
        elif re.match(r'^([A-Z]{2,}|[A-Z]+[0-9]+)s$', part):
            processed_parts.append(part)
            
        # Во всех остальных случаях переводим в нижний регистр
        else:
            processed_parts.append(part.lower())
            
    return '_'.join(processed_parts)

def decamelize_dict(data):
    """Рекурсивно переводит все ключи словаря/списка в snake_case"""
    if isinstance(data, dict):
        return {camel_to_snake(key): decamelize_dict(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [decamelize_dict(item) for item in data]
    else:
        return data

if __name__ == "__main__":
    import sys
    import json
    import traceback

    # Настраиваем кодировку
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stdin.reconfigure(encoding="utf-8") 

    # Читаем аргументы один раз при старте сервера
    up2 = sys.argv[1] if len(sys.argv) > 1 else None

    # Запускаем бесконечный цикл прослушивания
    while True:
        try:
            line = sys.stdin.readline()

            if not line:
                break

            line = line.strip()
            if not line:
                continue

            # ИЗМЕНЕНИЕ ЗДЕСЬ: Парсим конверт целиком
            raw_request = json.loads(line)
            request = decamelize_dict(raw_request)
            
            # Достаем ID, флаг теста и чистый info
            req_id = request.get("req_id")
            is_test = request.get("is_test", False)
            info = request.get("info", {})
            
            # Сохраняем info в файл для отладки только если получен флаг isTest
            if is_test:
                test_save_info(info)

            result = None

            # Дальше всё работает с чистым info, как и раньше
            if info.id == "session--package-of-documents":
                result = session_PackageOfDocuments(info, up2)
            elif info.id == "session--empty-statements":
                result = session_EmptyStart(info, up2)
            elif info.id == "session--report":
                result = session_ReportStart(info, up2)
            elif info.id == "session--debtors":
                result = session_DebtorsStart(info, up2)
            elif info.id == "hours--based-on-the-first-month":
                result = hours_BasedOnTheFirstMonth(info, up2)
            elif info.id == "hours--summary-of-teachers":
                result = hours_SummaryOfTeachers(info, up2)
            elif info.id == "other--other--screenshot--transform":
                path = info.temp_path
                final_path = info.final_path
                result = extend_image(path, final_path)
            elif info.id == "other--other--num-den":
                result = other_NumDenStart(info, up2)

            # Отправляем ответ, прикрепляя req_id
            response_data = {"req_id": req_id, "result": result}
            
            print(json.dumps(response_data, ensure_ascii=False), flush=True)

        except Exception as e:
            error_data = {
                # Безопасно достаем req_id даже при ошибке
                "req_id": raw_request.get("req_id") if 'raw_request' in locals() and isinstance(raw_request, dict) else None,
                "result": None,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            print(json.dumps(error_data, ensure_ascii=False), flush=True)