import React from 'react';
import {Text,type TextStyle} from 'react-native';
import {GrizzlyPressable as Pressable} from './wild-interactions';
import type {useNativeAppearance} from './appearance';

export function NativeAccountButton({label,onPress,disabled=false,colors,text}:{label:string;onPress:()=>void;disabled?:boolean;colors:ReturnType<typeof useNativeAppearance>['colors'];text:TextStyle}){
 return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={{minHeight:48,padding:12,borderWidth:1,borderColor:colors.line,borderRadius:10,opacity:disabled?0.45:1}}><Text style={text}>{label}</Text></Pressable>;
}
