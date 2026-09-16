import { contextBridge, ipcRenderer } from 'electron';
import type { AppState, Command, DesktopApi } from '../shared/types';
const api: DesktopApi = {
  command: (command: Command) => ipcRenderer.invoke('rain:command', command),
  subscribe(callback) { const listener = (_event: unknown, value: AppState) => callback(value); ipcRenderer.on('rain:state', listener); return () => ipcRenderer.removeListener('rain:state', listener); }
};
contextBridge.exposeInMainWorld('rain', api);
