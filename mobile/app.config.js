// The default still uses app.json unchanged. Grizzly gets its own install identity.
module.exports=({config})=>{
 const grizzly=process.env.EXPO_PUBLIC_APP_VARIANT==='grizzly';
 const legacy=process.env.EXPO_PUBLIC_NATIVE_LINEAGE==='legacy-movefield';
 if(grizzly&&legacy)throw Error('Grizzly has a separate app identity. A Movefield upgrade cannot use the Grizzly variant.');
 if(legacy)return {...config,version:'0.1.6',android:{...config.android,package:'com.ghinz32.movefield',versionCode:7}};
 return grizzly?{
 ...config,version:'0.1.5',name:'Grizzly Fitness',slug:'grizzly-fitness-wautoma',scheme:'grizzlyfitness',
 icon:'./assets/grizzly-icon.png',
 ios:{...config.ios,bundleIdentifier:'com.ghinz32.grizzlyfitness.prototype',buildNumber:'6'},
 android:{...config.android,package:'com.ghinz32.grizzlyfitness.prototype',versionCode:6,adaptiveIcon:{backgroundColor:'#000000',foregroundImage:'./assets/grizzly-icon-foreground.png'}},
 web:{...config.web,favicon:'./assets/grizzly-icon.png'},
}:config;
};
