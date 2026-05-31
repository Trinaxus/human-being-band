export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatTime = (timeString: string): string => {
  try {
    const [hours, minutes, seconds] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    date.setSeconds(parseInt(seconds || '0', 10));
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

export const formatDuration = (duration: number): string => {
  if (!duration) return '0:00';
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const isTimeToPlay = (time: string): boolean => {
  try {
    const now = new Date();
    const [scheduledHours, scheduledMinutes, scheduledSeconds = '0'] = time.split(':').map(Number);
    
    return (
      now.getHours() === scheduledHours && 
      now.getMinutes() === scheduledMinutes &&
      now.getSeconds() === scheduledSeconds
    );
  } catch (error) {
    console.error('Error checking time to play:', error);
    return false;
  }
};

export const getCurrentTime = (): string => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const hasBeenPlayedToday = (lastPlayed?: string): boolean => {
  if (!lastPlayed) return false;
  
  const lastPlayedDate = new Date(lastPlayed);
  const now = new Date();
  
  return (
    lastPlayedDate.getDate() === now.getDate() &&
    lastPlayedDate.getMonth() === now.getMonth() &&
    lastPlayedDate.getFullYear() === now.getFullYear() &&
    lastPlayedDate.getHours() === now.getHours() &&
    lastPlayedDate.getMinutes() === now.getMinutes() &&
    lastPlayedDate.getSeconds() === now.getSeconds()
  );
};