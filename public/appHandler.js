var defaultApps = {
  Settings: [
    title =  "Settings",
    icon = "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fcdn.onlinewebfonts.com%2Fsvg%2Fdownload_144812.png&f=1&nofb=1",
    relativeUrl = true,
    url = location.protocol + '//' + location.hostname + '/settings.html',
    uninstallable = false
  ],
  Terminal: [
   title = "Terminal",
   icon = "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn2.iconfinder.com%2Fdata%2Ficons%2Fthe-circle-icons%2F512%2Fterminal.png&f=1&nofb=1",
   relativeUrl = true,
   url = location.protocol + '//' + location.hostname + '/term.html',
   uninstallable = false
  ]
}
class App {
  constructor(name,icon,relativeUrl,url,uninstallable,first){
    this.name = name;
    this.icon = icon;
    this.relativeUrl = relativeUrl;
    this.url = url;
    this.uninstallable = uninstallable;

    var hii = localStorage.getItem('apps')
    if (hii == null) {
      localStorage.setItem('hii','[]');
      hii = localStorage.getItem('hii')
    }
    var hiii = JSON.parse(hii);
    if (first == false){
    hiii.push([name,icon,relativeUrl,url,uninstallable])
    localStorage.setItem('hii',hiii);
    }
    let d = document.getElementById('thepog')
    let te = d.cloneNode(true)
    te.setAttribute('id','');
 te.setAttribute('onclick',`openWindow('${name}','${url}', '${icon}')`)
    let de = te.childNodes[1]
    de.src = icon;
    let e = te.childNodes[3]
    e.textContent = name;
    let omg = document.querySelector('.mainmain')
    omg.appendChild(te)
  }
  uninstall(){
    
  }
}
function downloadApp(appName,icon,relativeUrl,url,uninstallable,first) {
  let app1 = new App(appName,icon,relativeUrl,url,uninstallable,first)

}



function initializeApps(){
  // title - [0]
  // icon - [1]
  // relativeUrl - [2]
  // url - [3]
  // uninstallable - [4]
  for (let ew in defaultApps){
        //console.log(defaultApps[ew])
  let lol = defaultApps[ew]
  let q = downloadApp(lol[0],lol[1],lol[2],lol[3],lol[4],true)

  }
  console.log("Apps initialized!")
}

initializeApps();