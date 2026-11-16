const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{resetPosition:()=>ipcRenderer.send('reset-position'),onPositionReset:callback=>ipcRenderer.on('position-reset',()=>callback()),setPinned:value=>ipcRenderer.send('set-pinned',value),onLayout:callback=>ipcRenderer.on('layout',(_,value)=>callback(value)),dragEnd:()=>ipcRenderer.send('drag-end'),onPointerOutside:callback=>ipcRenderer.on('pointer-outside',callback),expand:open=>ipcRenderer.send('expand',open),move:delta=>ipcRenderer.send('move',delta),close:()=>ipcRenderer.send('close')});



