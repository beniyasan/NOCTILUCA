import {operationId} from './operation-id.js';
import {freshState,reduce,viewState} from '../game/rules.js';
export async function createGuest(){
  const response=await fetch('/content/conversations.json');if(!response.ok)throw new Error('会話データを読み込めませんでした。');
  const data=await response.json();let state=freshState(),revision=0;state.displayName='旅人';
  return {
    initial(){return {playerId:null,revision,updatedAt:null,state:viewState(state,data)};},
    async command(c){const r=reduce(state,c,data,{token:operationId()});state=r.state;revision++;return {playerId:null,revision,updatedAt:null,state:viewState(state,data),outcome:r.outcome};}
  };
}
