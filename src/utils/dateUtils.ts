/**
 * Utility functions for date, day, and time formatting for faculty broadcasts & timetable
 */

export function formatBroadcastDateTime(
  dateString: string,
  lang: 'ms' | 'en' = 'ms'
): {
  dayName: string;
  formattedDate: string;
  formattedTime: string;
  fullDisplay: string;
} {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) {
    return {
      dayName: '',
      formattedDate: '',
      formattedTime: '',
      fullDisplay: '',
    };
  }

  const daysMs = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthsMs = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = lang === 'en' ? daysEn[d.getDay()] : daysMs[d.getDay()];
  const monthName = lang === 'en' ? monthsEn[d.getMonth()] : monthsMs[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const formattedDate = `${day} ${monthName} ${year}`;

  const rawHours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  let period = '';
  let hours = rawHours;

  if (lang === 'en') {
    period = rawHours >= 12 ? 'PM' : 'AM';
    hours = rawHours % 12 || 12;
  } else {
    if (rawHours >= 19) {
      period = 'MLM';
    } else if (rawHours >= 14) {
      period = 'PTG';
    } else if (rawHours >= 12) {
      period = 'THARI';
    } else {
      period = 'PG';
    }
    hours = rawHours % 12 || 12;
  }

  const formattedTime = `${hours}:${minutes} ${period}`;
  const fullDisplay = `${dayName}, ${formattedDate} • ${formattedTime}`;

  return { dayName, formattedDate, formattedTime, fullDisplay };
}

/**
 * Checks if a timestamp is within the active 24-hour window
 */
export function isWithin24Hours(dateString?: string): boolean {
  if (!dateString) return false;
  try {
    const normalized = dateString.includes(' ') && !dateString.includes('T') ? dateString.replace(' ', 'T') : dateString;
    const time = new Date(normalized).getTime();
    if (isNaN(time)) return false;
    const diff = Date.now() - time;
    return diff >= 0 && diff < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}
