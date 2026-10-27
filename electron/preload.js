// Ponte segura entre a interface (React) e o processo principal
const { contextBridge, ipcRenderer, webUtils } = require('electron');

const chamar = (canal, ...args) => ipcRenderer.invoke(canal, ...args);

contextBridge.exposeInMainWorld('api', {
  chamar,
  // Caminho real de um arquivo arrastado para a janela
  caminhoDoArquivo: file => webUtils.getPathForFile(file)
});
