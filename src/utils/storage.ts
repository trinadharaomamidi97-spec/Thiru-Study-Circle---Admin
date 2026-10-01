import { ThiruData } from '../types';
import { INITIAL_THIRU_DATA } from '../sampleData';

const STORAGE_KEY = 'thiru_study_circle_data';

export function loadThiruData(): ThiruData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Basic verification that key components exist
      if (parsed.courses && parsed.videos && parsed.exams && parsed.materials && parsed.announcements) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load data from localStorage', e);
  }
  return INITIAL_THIRU_DATA;
}

export function saveThiruData(data: ThiruData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data to localStorage', e);
  }
}

export function exportDataAsJSON(data: ThiruData): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('download', `thiru_study_circle_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
