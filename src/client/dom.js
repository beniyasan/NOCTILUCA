// Small DOM helpers shared by the dialog and panel UIs.
export const $=id=>document.getElementById(id);
// Creates an element with a class; text is set only when given.
export const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
