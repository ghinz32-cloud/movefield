import React,{Component,type ReactNode} from 'react';
import {Pressable,ScrollView,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

type Props={children:ReactNode;beforeReopen:()=>Promise<unknown>;onFailure?:()=>void};
type State={failed:boolean;reopening:boolean;attempt:number;retryFailed:boolean};
/** Deliberately independent of preferences, custom fonts and application records. */
export class NativeAppBoundary extends Component<Props,State>{
 state:State={failed:false,reopening:false,attempt:0,retryFailed:false};
 private reopening=false;
 static getDerivedStateFromError(){return {failed:true,reopening:false}}
 componentDidCatch(){this.props.onFailure?.()}
 reopen=async()=>{
  if(this.reopening)return;
  this.reopening=true;
  this.setState({reopening:true,retryFailed:false});
  try{await this.props.beforeReopen();this.setState(state=>({failed:false,reopening:false,attempt:state.attempt+1,retryFailed:false}))}
  catch{this.setState({reopening:false,retryFailed:true})}
  finally{this.reopening=false}
 };
 render(){
  if(!this.state.failed)return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
  return <SafeAreaView style={{flex:1,backgroundColor:'#f6f8f7'}}>
   <ScrollView contentContainerStyle={{flexGrow:1,padding:24,justifyContent:'center'}} keyboardShouldPersistTaps="handled">
    <View style={{width:'100%',maxWidth:540,alignSelf:'center',gap:18}}>
     <Text accessibilityRole="header" style={{color:'#18322b',fontSize:26,lineHeight:34,fontWeight:'700'}}>This screen could not open</Text>
     <Text style={{color:'#18322b',fontSize:17,lineHeight:26}}>Your saved records are kept on this device. Reopen the saved app to try again. Unsaved edits may need to be entered again.</Text>
     {this.state.retryFailed&&<Text accessibilityRole="alert" style={{color:'#8b3026',fontSize:17,lineHeight:26}}>The app is not ready to reopen yet. Wait for the current action, then try again.</Text>}
     <Pressable accessibilityRole="button" accessibilityState={{disabled:this.state.reopening}} disabled={this.state.reopening} onPress={()=>{void this.reopen()}} style={{minHeight:52,padding:16,borderRadius:12,backgroundColor:'#214d3a',alignItems:'center',justifyContent:'center',opacity:this.state.reopening?.7:1}}><Text style={{color:'#fff',fontSize:17,lineHeight:26,fontWeight:'700',textAlign:'center'}}>{this.state.reopening?'Waiting for current saves…':'Reopen saved app'}</Text></Pressable>
     <Text style={{color:'#53665e',fontSize:14,lineHeight:21}}>If the problem repeats, keep the app installed to retain its saved records. Support code: NATIVE-RENDER-01.</Text>
    </View>
   </ScrollView>
  </SafeAreaView>;
 }
}
