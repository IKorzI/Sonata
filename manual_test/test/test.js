const semesterStartDate = "01.09.2025";
const semesterEndDate = "31.12.2025";

function getSemesterMonths(startStr, endStr) {
    const parseDate = (str) => {
        const [day, month, year] = str.split('.').map(Number);
        return new Date(year, month - 1, day);
    };

    const formatDate = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
    };

    const adjustBusinessDay = (date, isStart) => {
        const d = new Date(date);
        const dayOfWeek = d.getDay(); 

        if (isStart) {
            if (dayOfWeek === 6) d.setDate(d.getDate() + 2); // Сб -> Пн
            if (dayOfWeek === 0) d.setDate(d.getDate() + 1); // Вс -> Пн
        } else {
            if (dayOfWeek === 6) d.setDate(d.getDate() - 1); // Сб -> Пт
            if (dayOfWeek === 0) d.setDate(d.getDate() - 2); // Вс -> Пт
        }
        return d;
    };

    // Хелпер для получения дня недели в формате (0-Пн ... 6-Вс)
    const getEuroDayOfWeek = (date) => {
        const day = date.getDay(); // 0(Вс), 1(Пн)...
        return day === 0 ? 6 : day - 1;
    };

    const startDate = parseDate(startStr);
    const endDate = parseDate(endStr);
    const result = [];

    let currentIterDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (currentIterDate <= endDate) {
        const currentYear = currentIterDate.getFullYear();
        const currentMonth = currentIterDate.getMonth();

        let monthStart = (currentYear === startDate.getFullYear() && currentMonth === startDate.getMonth()) 
            ? new Date(startDate) 
            : new Date(currentYear, currentMonth, 1);

        let monthEnd = (currentYear === endDate.getFullYear() && currentMonth === endDate.getMonth()) 
            ? new Date(endDate) 
            : new Date(currentYear, currentMonth + 1, 0);

        const adjustedStart = adjustBusinessDay(monthStart, true);
        const adjustedEnd = adjustBusinessDay(monthEnd, false);

        result.push({
            monthIndex: currentMonth + 1,
            year: currentYear,
            startDay: adjustedStart.getDate(),
            endDay: adjustedEnd.getDate(),
            startWeekDay: getEuroDayOfWeek(adjustedStart), // Добавлено поле
            start: formatDate(adjustedStart),
            end: formatDate(adjustedEnd)
        });

        currentIterDate.setMonth(currentIterDate.getMonth() + 1);
    }

    return result;
}

const monthsList = getSemesterMonths(semesterStartDate, semesterEndDate);
console.log(monthsList);