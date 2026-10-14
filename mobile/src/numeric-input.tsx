import React,{useState} from 'react';
import {TextInput,type TextInputProps} from 'react-native';

type Props=Omit<TextInputProps,'value'|'onChangeText'> & {value:number|null;onValueChange:(value:number|null)=>void;min?:number;max?:number;nullable?:boolean};
/** Preserve decimal/sign drafts while publishing only valid values to the workout editor. */
export function NativeNumericInput({value,onValueChange,min=0,max=9999,nullable=true,...props}:Props){
 const format=(number:number|null)=>number===null||!nullable&&number===0?'':String(number);
 const [text,setText]=useState(()=>format(value)),[previous,setPrevious]=useState(value);
 if(!Object.is(previous,value)){setPrevious(value);setText(format(value))}
 return <TextInput {...props} value={text} keyboardType={min<0?'numbers-and-punctuation':'decimal-pad'} onChangeText={draft=>{
  if(!/^-?\d{0,7}(?:[.,]\d{0,4})?$/.test(draft)||min>=0&&draft.startsWith('-'))return;
  const incomplete=['-','.','-.',',','-,'].includes(draft);
  const next=draft===''?(nullable?null:0):incomplete?undefined:Number(draft.replace(',','.'));
  if(next!==undefined&&next!==null&&(!Number.isFinite(next)||next<min||next>max))return;
  setText(draft);if(next!==undefined)onValueChange(next);
 }}/>
}
