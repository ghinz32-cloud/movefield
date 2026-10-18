'use client';
import {Component,type ReactNode} from 'react';
import {Button} from './ui/button';

type Props={title:string;children:ReactNode;onReload:()=>Promise<void>};

/** Optional downloads must not remove the workspace or its local recovery tools. */
export class LazySectionBoundary extends Component<Props,{failed:boolean;reloading:boolean;error:string}>{
 state={failed:false,reloading:false,error:''};
 static getDerivedStateFromError(){return {failed:true}}
 private reload=async()=>{
  if(this.state.reloading)return;
  this.setState({reloading:true,error:''});
  try{await this.props.onReload()}
  catch(error){this.setState({error:error instanceof Error?error.message:'The app could not reload. Keep this visit open and try again.'})}
  finally{this.setState({reloading:false})}
 };
 render(){
  if(!this.state.failed)return this.props.children;
  return <section className="card" aria-label={this.props.title+' unavailable'}>
   <div role="alert"><h2>{this.props.title} couldn’t open</h2><p>Your saved training stays on this device. You can use the other sections, or reload the app to try again.</p></div>
   <Button variant="outline" disabled={this.state.reloading} onClick={()=>void this.reload()}>{this.state.reloading?'Waiting for saves…':'Reload app'}</Button>
   {this.state.error&&<p role="alert">{this.state.error}</p>}
  </section>;
 }
}
