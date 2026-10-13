'use client';
import {Component,type ReactNode} from 'react';
import {Button} from './ui/button';

type Props={children:ReactNode;onExit:()=>void};
/** Preview failures must not replace the user's saved plan with a blank screen. */
export class WorkflowBoundary extends Component<Props,{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 render(){
  if(!this.state.failed)return this.props.children;
  return <main className="startup" role="alert"><h1>Plan setup couldn’t load</h1><p>Your accepted plan and workout history are kept. Retry your saved setup, or return to training.</p><div className="button-row"><Button onClick={()=>this.setState({failed:false})}>Retry setup</Button><Button variant="outline" onClick={this.props.onExit}>Return to training</Button></div></main>;
 }
}
