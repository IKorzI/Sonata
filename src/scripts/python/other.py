from openpyxl.styles import PatternFill, Alignment
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter
import os
from datetime import datetime
import time
import win32clipboard as cb
from PIL import Image
from datetime import datetime, timedelta

from utils import MONTH_NAMES_CAPITAL
from utils import save_file

def get_clipboard_html():
    """Возвращает HTML из буфера, если есть"""
    fmt = cb.RegisterClipboardFormat('HTML Format')
    cb.OpenClipboard()
    try:
        if cb.IsClipboardFormatAvailable(fmt):
            data = cb.GetClipboardData(fmt)
            # data — bytes → переводим в str
            if isinstance(data, bytes):
                try:
                    return data.decode('utf-8', errors='ignore')
                except:
                    return data.decode('cp1251', errors='ignore')
            return data
    except Exception:
        pass
    finally:
        cb.CloseClipboard()

    return None

def other_ScreenshotMode():
    last_html = None

    while True:
        html = get_clipboard_html()

        if html and html != last_html and 'Microsoft Excel' in html:
            last_html = html

            print('__PY_READY__', flush=True)
            print(html, flush=True)

        time.sleep(0.2)

def extend_image(path, final_path):
    margin_percent = 2
    color = (255, 255, 255)

    img = Image.open(path)
    w, h = img.size
    border_x = int(w * margin_percent / 100)
    border_y = int(h * margin_percent / 100)
    border = min(border_x, border_y)

    new_img = Image.new('RGB', (w + border * 2, h + border * 2), color)
    new_img.paste(img, (border, border))
    
    new_img.save(final_path, 'PNG') 
    return True

def get_calendar_schedule(start_str, end_str, align_weekday=None):
    # 1. Преобразуем строки в даты
    start_date = datetime.strptime(start_str, '%d.%m.%Y')
    end_date = datetime.strptime(end_str, '%d.%m.%Y')

    # 2. Собираем список всех рабочих дней (Mon-Fri)
    all_work_days = []
    current_date = start_date
    
    while current_date <= end_date:
        if current_date.weekday() < 5:
            all_work_days.append(current_date)
        current_date += timedelta(days=1)

    # --- НОВАЯ ЛОГИКА: Выравнивание (Сдвиг) ---
    # Если передан день недели для выравнивания (0=Пн...4=Пт),
    # добавляем None в начало, чтобы первый реальный день попал в нужную ячейку.
    if align_weekday is not None and all_work_days:
        # Берем реальный день недели первого рабочего дня в этом диапазоне
        first_real_weekday = all_work_days[0].weekday()
        
        # Считаем разницу. Пример: 
        # Sem1 Start = Вторник (1). align_weekday = 1.
        # Sem2 Start = Четверг (3). first_real_weekday = 3.
        # offset = (3 - 1) % 5 = 2. Нужно добавить 2 пустых дня (Вторник, Среда).
        offset = (first_real_weekday - align_weekday) % 5
        
        # Добавляем offset пустых значений в начало списка
        for _ in range(offset):
            all_work_days.insert(0, None)

    days = {}
    
    # 3. Разбиваем список на чанки по 5
    for i in range(0, len(all_work_days), 5):
        week_chunk = all_work_days[i : i + 5]
        
        # Ищем первый НЕ пустой день в чанке для определения месяца
        first_real_day = next((d for d in week_chunk if d is not None), None)
        
        if first_real_day:
            month_key = f'{first_real_day.month:02d}'
            
            # Подготовка данных: day или None
            week_data = [(d.day if d else None) for d in week_chunk]
            
            # Дополняем None до 5, если это последний кусок
            while len(week_data) < 5:
                week_data.append(None)
                
            if month_key not in days:
                days[month_key] = []
            days[month_key].append(week_data)

    # 4. Определяем номер первого дня пятидневки
    if all_work_days:
        # Если есть align_weekday, возвращаем его + 1, чтобы сохранить логику колонок Sem1
        if align_weekday is not None:
             first_day_num = align_weekday + 1
        else:
            # Ищем первый реальный день, если начало списка забито None (хотя для Sem1 это не нужно)
            first_real_obj = next((d for d in all_work_days if d is not None), None)
            if first_real_obj:
                 first_day_num = first_real_obj.weekday() + 1
            else:
                 first_day_num = 1 # Fallback
    else:
        first_day_num = start_date.weekday() + 1 

    return {
        'calendar': days,
        'first_day': first_day_num
    }

def other_NumDenStart(info, app_path):
    answer = {'success': True, 'files': []}
    path_to_save = os.path.dirname(info['file_path'])
    os.makedirs(path_to_save, exist_ok=True) 
    path = f'{app_path}/public/examples/work/'
    days_of_week = ['ПН', 'ВВ', 'СР', 'ЧТ', 'ПТ']

    workbook = load_workbook(f'{path}/num-den.xlsx')
    gray_fill = PatternFill(start_color='BFBFBF', end_color='BFBFBF', fill_type='solid')

    # ==========================
    # I СЕМЕСТР
    # ==========================
    sheet = workbook['I семестр']
    
    # Считаем первый семестр как обычно
    result1 = get_calendar_schedule(info['semester_1_start'], info['semester_1_end'])
    
    # Запоминаем weekday index (0..4) первого дня первого семестра для синхронизации
    # result1.first_day возвращает 1..5, нам нужно 0..4 для расчетов
    sem_1_weekday_idx = result1['first_day'] - 1

    col_num = 5
    for i in range(result1['first_day'], 5 + 1):
        sheet.cell(row=4, column=col_num).value = days_of_week[i - 1]
        col_num += 1
    for i in range(1, result1['first_day']):
        sheet.cell(row=4, column=col_num).value = days_of_week[i - 1]
        col_num += 1

    week_num = 1
    step = 0
    dels = 0
    
    for month_num, calendar in result1['calendar'].items():
        row = 5 + 7 * step - dels
        sheet.merge_cells(start_row=row, start_column=3, end_row=row, end_column=9)
        # Убедитесь, что monthNamesCapital доступен
        sheet.cell(row=row, column=3).value = MONTH_NAMES_CAPITAL[month_num] 
        for i, weak in enumerate(calendar):
            row = (5 + 7 * step) + i + 1 - dels
            sheet.cell(row=row, column=3).value = week_num
            
            if week_num % 2 != 0:
                sheet.cell(row=row, column=4).value = 'Чисельник'
                sheet.cell(row=row, column=4).alignment = Alignment(horizontal='left', vertical='center')
            else:
                sheet.cell(row=row, column=4).value = 'Знаменник'
                sheet.cell(row=row, column=4).alignment = Alignment(horizontal='right', vertical='center')
                for col_num in range(3, 9 + 1):
                    sheet.cell(row=row, column=col_num).fill = gray_fill
            
            week_num += 1
            for a, date in enumerate(weak):
                # Если date is None (пустой день), ничего не пишем
                if date is not None:
                    sheet.cell(row=row, column=4 + a + 1).value = date
                    
        if len(calendar) < 6:
            for i in range(len(calendar) + 1, 6 + 1):
                row = (5 + 7 * step) + i - dels
                sheet.delete_rows(row)
                dels += 1
        step += 1

    for row in range(35 - dels, 35):
        sheet.row_dimensions[row].hidden = True

    # ==========================
    # II СЕМЕСТР
    # ==========================
    sheet = workbook['II семестр']
    
    # ПЕРЕДАЕМ align_weekday!
    # Это заставит функцию добавить пустые ячейки (None) в начало, 
    # чтобы дни встали под теми же заголовками, что и в 1 семестре.
    result2 = get_calendar_schedule(info['semester_2_start'], info['semester_2_end'], align_weekday=sem_1_weekday_idx)

    # ВАЖНО: Заголовки дней недели рисуем по result1.first_day, а не result2!
    # Мы хотим, чтобы структура колонок была идентичной первому семестру.
    col_num = 5
    for i in range(result1['first_day'], 5 + 1):
        sheet.cell(row=4, column=col_num).value = days_of_week[i - 1]
        col_num += 1
    for i in range(1, result1['first_day']):
        sheet.cell(row=4, column=col_num).value = days_of_week[i - 1]
        col_num += 1

    # Логика расчета четности недель
    s1_date = datetime.strptime(info['semester_1_start'], '%d.%m.%Y')
    s2_date = datetime.strptime(info['semester_2_start'], '%d.%m.%Y')

    monday_sem1 = s1_date - timedelta(days=s1_date.weekday())
    monday_sem2 = s2_date - timedelta(days=s2_date.weekday())

    delta_days = (monday_sem2 - monday_sem1).days
    weeks_passed = delta_days // 7
    current_parity_week = 1 + weeks_passed
    
    display_week_num = 1
    step = 0
    dels = 0
    
    for month_num, calendar in result2['calendar'].items():
        row = 5 + 7 * step - dels
        sheet.merge_cells(start_row=row, start_column=3, end_row=row, end_column=9)
        sheet.cell(row=row, column=3).value = MONTH_NAMES_CAPITAL[month_num]
        
        for i, weak in enumerate(calendar):
            row = (5 + 7 * step) + i + 1 - dels
            sheet.cell(row=row, column=3).value = display_week_num
            
            if current_parity_week % 2 != 0:
                sheet.cell(row=row, column=4).value = 'Чисельник'
                sheet.cell(row=row, column=4).alignment = Alignment(horizontal='left', vertical='center')
            else:
                sheet.cell(row=row, column=4).value = 'Знаменник'
                sheet.cell(row=row, column=4).alignment = Alignment(horizontal='right', vertical='center')
                for col_num in range(3, 9 + 1):
                    sheet.cell(row=row, column=col_num).fill = gray_fill
            
            current_parity_week += 1
            display_week_num += 1

            for a, date in enumerate(weak):
                # Здесь date может быть None из-за выравнивания.
                # Просто пропускаем запись в ячейку.
                if date is not None:
                    sheet.cell(row=row, column=4 + a + 1).value = date

        if len(calendar) < 6:
            for i in range(len(calendar) + 1, 6 + 1):
                row = (5 + 7 * step) + i - dels
                sheet.delete_rows(row)
                dels += 1
        step += 1

    for row in range(49 - dels, 49):
        sheet.row_dimensions[row].hidden = True

    workbook_path = save_file(workbook, info['file_path']) # Функция должна быть определена где-то еще
    if workbook_path != True:
        answer.files.append(workbook_path)

    return answer
