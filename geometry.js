const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function layout(anchor,area,size,direction){
 const side=direction||(anchor.x+24>=area.x+area.width/2?'left':'right');
 const width=Math.min(size.width,Math.max(1,area.width-56)),height=Math.min(size.height,area.height-8);
 const panelX=clamp(side==='left'?anchor.x+48-width:anchor.x,area.x,area.x+area.width-width);
 const panelY=clamp(anchor.y,area.y+4,area.y+area.height-height-4);
 const x=Math.min(anchor.x,panelX),y=Math.min(anchor.y,panelY);
 return {side,bounds:{x,y,width:Math.ceil(Math.max(anchor.x+48,panelX+width)-x),height:Math.ceil(Math.max(anchor.y+48,panelY+height)-y)},orb:{x:anchor.x-x+4,y:anchor.y-y+4},panel:{x:panelX-x,y:panelY-y,width,height}};
}
module.exports={layout};

