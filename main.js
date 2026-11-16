const {app,BrowserWindow,ipcMain,screen,Tray,Menu,nativeImage}=require('electron');
const path=require('path'),{layout}=require('./geometry');
if(process.env.TODO_TEST_PROFILE)app.setPath('userData',path.resolve(process.env.TODO_TEST_PROFILE));
let mainWindow,tray;
app.on('second-instance',()=>{if(mainWindow&&!mainWindow.isDestroyed()){mainWindow.show();mainWindow.focus()}});
if(!app.requestSingleInstanceLock())app.quit();else{
app.whenReady().then(()=>{
 const win=new BrowserWindow({width:48,height:48,frame:false,resizable:false,skipTaskbar:true,transparent:true,alwaysOnTop:true,webPreferences:{backgroundThrottling:false,preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});
 mainWindow=win;
 let pinned=false;ipcMain.on('set-pinned',(_,value)=>{pinned=!!value});
 let anchor=null,direction=null,size=null,outsideSince=0;
 function place(){const area=screen.getDisplayNearestPoint({x:anchor.x+24,y:anchor.y+24}).workArea;const l=layout(anchor,area,size,direction);direction=l.side;win.setBounds(l.bounds);win.webContents.send('layout',l)}
 ipcMain.on('expand',(_,value)=>{if(value&&Number.isFinite(value.height)){if(!size){const [x,y]=win.getPosition();anchor={x,y}}size={width:Math.max(320,Math.min(520,Math.ceil(value.width)||320)),height:Math.max(60,Math.min(720,Math.ceil(value.height)))};place()}else if(size&&!pinned){win.setBounds({...anchor,width:48,height:48});size=null;direction=null;win.webContents.send('layout',null)}});
 ipcMain.on('move',(_,delta)=>{if(Array.isArray(delta)&&delta.length===2&&delta.every(Number.isFinite)){if(size){anchor.x+=Math.round(delta[0]);anchor.y+=Math.round(delta[1]);place()}else{const [x,y]=win.getPosition();win.setPosition(x+Math.round(delta[0]),y+Math.round(delta[1]))}}});
 ipcMain.on('drag-end',()=>{if(size){direction=null;place()}});
 function show(){win.show();win.focus()}
 function resetPosition(){
  const area=screen.getPrimaryDisplay().workArea;
  // Put the widget in a predictable, visible spot near the top center.
  anchor={x:area.x+Math.max(0,Math.floor((area.width-48)/2)),y:area.y+Math.max(0,Math.min(80,area.height-48))};
  direction=null;
  outsideSince=0;
  if(size)place();
  else win.setBounds({...anchor,width:48,height:48});
  show();
  win.webContents.send('position-reset');
 }
 ipcMain.on('reset-position', event => {
  if(event.sender===win.webContents)setImmediate(resetPosition);
 });
 const pixels=Buffer.alloc(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;if((x-16)**2+(y-16)**2<225){pixels[i]=226;pixels[i+1]=238;pixels[i+2]=246;pixels[i+3]=255;if((y>=9&&y<=12&&x>=8&&x<=24)||(x>=15&&x<=17&&y>=12&&y<=25)){pixels[i]=65;pixels[i+1]=65;pixels[i+2]=65}}}
 tray=new Tray(nativeImage.createFromBitmap(pixels,{width:32,height:32,scaleFactor:1}));tray.setToolTip('TODO');
 const menu=Menu.buildFromTemplate([{label:'Show TODO',click:show},{label:'Reset Position',click:()=>setImmediate(resetPosition)},{type:'separator'},{label:'Quit',click:()=>app.quit()}]);tray.setContextMenu(menu);tray.on('click',show);
 if(process.env.TODO_TEST_PROFILE)globalThis.todoQA={win,tray,menu,resetPosition,show};
 const timer=setInterval(()=>{if(win.isDestroyed())return;const p=screen.getCursorScreenPoint(),b=win.getBounds(),inside=p.x>=b.x&&p.x<b.x+b.width&&p.y>=b.y&&p.y<b.y+b.height;if(inside){outsideSince=0;return}if(!outsideSince)outsideSince=Date.now();if(Date.now()-outsideSince>=120)win.webContents.send('pointer-outside')},60);
 win.on('closed',()=>clearInterval(timer));ipcMain.on('close',()=>win.close());win.loadFile('index.html');
});app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>tray?.destroy());}



