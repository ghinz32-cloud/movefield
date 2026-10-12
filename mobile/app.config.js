// The default still uses app.json unchanged. Grizzly gets its own install identity.
module.exports=({config})=>process.env.EXPO_PUBLIC_APP_VARIANT==='grizzly'?{
 ...config,name:'Grizzly Fitness',slug:'grizzly-fitness-wautoma',scheme:'grizzlyfitness',
 icon:'./assets/grizzly-icon.png',
 ios:{...config.ios,bundleIdentifier:'com.ghinz32.grizzlyfitness.prototype'},
 android:{...config.android,package:'com.ghinz32.grizzlyfitness.prototype',adaptiveIcon:{backgroundColor:'#24221d',foregroundImage:'./assets/grizzly-icon-foreground.png'}},
 web:{...config.web,favicon:'./assets/grizzly-icon.png'},
}:config;
