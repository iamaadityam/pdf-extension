export const BrowserDetector = {
  isChrome(): boolean {
    return navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
  },
  
  isBrave(): boolean {
    return navigator.userAgent.includes('Brave') || 
           (navigator.userAgent.includes('Chrome') && 
            'brave' in navigator);
  },
  
  isFirefox(): boolean {
    return navigator.userAgent.includes('Firefox');
  },
  
  getCurrentBrowser(): 'chrome' | 'brave' | 'firefox' | 'unknown' {
    if (this.isBrave()) return 'brave';
    if (this.isChrome()) return 'chrome';
    if (this.isFirefox()) return 'firefox';
    return 'unknown';
  }
};