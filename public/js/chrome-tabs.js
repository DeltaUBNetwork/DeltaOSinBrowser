
import _browser_ from "./objects/browser.js";
const TAB_CONTENT_MARGIN = 10;
const TAB_CONTENT_OVERLAP_DISTANCE = 1;

const TAB_OVERLAP_DISTANCE = TAB_CONTENT_MARGIN * 2 + TAB_CONTENT_OVERLAP_DISTANCE;

const TAB_CONTENT_MIN_WIDTH = 24;
const TAB_CONTENT_MAX_WIDTH = 240;

const TAB_SIZE_SMALL = 84;
const TAB_SIZE_SMALLER = 60;
const TAB_SIZE_MINI = 48;
const NEW_TAB_BUTTON_AREA = 90;

const noop = _ => {};

const closest = (value, array) => {
  let closest = Infinity;
  let closestIndex = -1;

  array.forEach((v, i) => {
    if (Math.abs(value - v) < closest) {
      closest = Math.abs(value - v);
      closestIndex = i;
    }
  });

  return closestIndex;
}

const tabTemplate = `
  <div class="chrome-tab" oncontextmenu="return showContextMenu(event);">
    <div class="chrome-tab-dividers"></div>
    <div class="chrome-tab-background">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg"><defs><symbol id="chrome-tab-geometry-left" viewBox="0 0 214 36"><path d="M17 0h197v36H0v-2c4.5 0 9-3.5 9-8V8c0-4.5 3.5-8 8-8z"/></symbol><symbol id="chrome-tab-geometry-right" viewBox="0 0 214 36"><use xlink:href="#chrome-tab-geometry-left"/></symbol><clipPath id="crop"><rect class="mask" width="100%" height="100%" x="0"/></clipPath></defs><svg width="52%" height="100%"><use xlink:href="#chrome-tab-geometry-left" width="214" height="36" class="chrome-tab-geometry"/></svg><g transform="scale(-1, 1)"><svg width="52%" height="100%" x="-100%" y="0"><use xlink:href="#chrome-tab-geometry-right" width="214" height="36" class="chrome-tab-geometry"/></svg></g></svg>
    </div>
    <div class="chrome-tab-content">
      <div class="chrome-tab-favicon"></div>
      <div class="chrome-tab-title"></div>
      <div class="chrome-tab-drag-handle"></div>
      <div class="chrome-tab-close"></div>
    </div>
  </div>
`;

const defaultTapProperties = {
  title: "New tab",
  url: "../newtab.html",
  favicon: true,
  animate: true,
  background: true
};

let instanceId = 0;

class ChromeTabs {
  constructor() {
    this.draggabillies = [];
  }

  init(el) {
    this.el = el;

    this.instanceId = instanceId;
    this.el.setAttribute("data-chrome-tabs-instance-id", this.instanceId);
    instanceId += 1;

    this.setupCustomProperties();
    this.setupStyleEl();
    this.setupEvents();
    this.layoutTabs();
    this.setupDraggabilly();
  }

  emit(eventName, data) {
    document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }

  setupCustomProperties() {
    this.el.style.setProperty("--tab-content-margin", `${ TAB_CONTENT_MARGIN }px`);
  }

  setupStyleEl() {
    this.styleEl = document.createElement("style");
    this.el.appendChild(this.styleEl);
  }

  setupEvents() {
    window.addEventListener("resize", _ => {
      this.cleanUpPreviouslyDraggedTabs();
     this.layoutTabs();
    })

    this.el.addEventListener("dblclick", event => {
      if ([this.el, this.tabContentEl].includes(event.target)) {
        this.addTab({
    title: "Main page",
    favicon: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F2%2F25%2FGoogle_Classroom_icon.svg%2F1200px-Google_Classroom_icon.svg.png&f=1&nofb=1",
  });

      }
    });

    this.el.addEventListener("click", ({ target }) => {
      if (target.classList.contains("new-tab-button")) {
        this.addTab({
    title: "Main page",
    favicon: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F2%2F25%2FGoogle_Classroom_icon.svg%2F1200px-Google_Classroom_icon.svg.png&f=1&nofb=1",
  });

      }
    });

    this.tabEls.forEach((tabEl) => this.setTabCloseEventListener(tabEl));
  }

  get tabEls() {
    return Array.prototype.slice.call(this.el.querySelectorAll(".chrome-tab"));
  }

  get tabContentEl() {
    return this.el.querySelector(".chrome-tabs-content");
  }

  get tabContentWidths() {
    const numberOfTabs = this.tabEls.length;
    const tabsContentWidth = this.el.clientWidth - NEW_TAB_BUTTON_AREA;
    const tabsCumulativeOverlappedWidth = (numberOfTabs - 1) * TAB_CONTENT_OVERLAP_DISTANCE;
    const targetWidth = (tabsContentWidth - (2 * TAB_CONTENT_MARGIN) + tabsCumulativeOverlappedWidth) / numberOfTabs;
    const clampedTargetWidth = Math.max(TAB_CONTENT_MIN_WIDTH, Math.min(TAB_CONTENT_MAX_WIDTH, targetWidth));
    const flooredClampedTargetWidth = Math.floor(clampedTargetWidth);
    const totalTabsWidthUsingTarget = (flooredClampedTargetWidth * numberOfTabs) + (2 * TAB_CONTENT_MARGIN) - tabsCumulativeOverlappedWidth;
    const totalExtraWidthDueToFlooring = tabsContentWidth - totalTabsWidthUsingTarget;

    // TODO - Support tabs with different widths / e.g. "pinned" tabs
    const widths = [];
    let extraWidthRemaining = totalExtraWidthDueToFlooring;
    for (let i = 0; i < numberOfTabs; i += 1) {
      const extraWidth = flooredClampedTargetWidth < TAB_CONTENT_MAX_WIDTH && extraWidthRemaining > 0 ? 1 : 0;
      widths.push(flooredClampedTargetWidth + extraWidth);
      if (extraWidthRemaining > 0) extraWidthRemaining -= 1;
    }

    return widths;
  }

  get tabContentPositions() {
    const positions = [];
    const tabContentWidths = this.tabContentWidths;

    let position = TAB_CONTENT_MARGIN;
    tabContentWidths.forEach((width, i) => {
      const offset = i * TAB_CONTENT_OVERLAP_DISTANCE;
      positions.push(position - offset);
      position += width;
    })

    return positions;
  }

  get tabPositions() {
    const positions = [];

    this.tabContentPositions.forEach((contentPosition) => {
      positions.push(contentPosition - TAB_CONTENT_MARGIN);
    })

    return positions;
  }

  layoutTabs() {
    const tabContentWidths = this.tabContentWidths;
    let tabsLen = this.tabEls.length;

    this.tabEls.forEach((tabEl, i) => {
      const contentWidth = tabContentWidths[i];
      const width = contentWidth + (2 * TAB_CONTENT_MARGIN);

      tabEl.style.width = width + "px";
      tabEl.removeAttribute("is-small");
      tabEl.removeAttribute("is-smaller");
      tabEl.removeAttribute("is-mini");

      if (contentWidth < TAB_SIZE_SMALL) tabEl.setAttribute("is-small", "");
      if (contentWidth < TAB_SIZE_SMALLER) tabEl.setAttribute("is-smaller", "");
      if (contentWidth < TAB_SIZE_MINI) tabEl.setAttribute("is-mini", "");
    })

    let styleHTML = "";
    this.tabPositions.forEach((position, i) => {
      styleHTML += `
        .chrome-tabs[data-chrome-tabs-instance-id="${ this.instanceId }"] .chrome-tab:nth-child(${ i + 1 }) {
          transform: translate3d(${ position }px, 0, 0)
        }
      `;
    })
    this.styleEl.innerHTML = styleHTML;

    if (this.el.offsetWidth - this.tabContentEl.offsetWidth > NEW_TAB_BUTTON_AREA + (TAB_CONTENT_MARGIN / 2) || tabsLen < 5) {
      this.tabContentEl.style.width = `${ (this.tabEls[0] ? this.tabEls[0].offsetWidth * tabsLen : 0) - (tabsLen > 0 ? ((tabsLen * TAB_CONTENT_MARGIN * 2) - TAB_CONTENT_MIN_WIDTH + TAB_CONTENT_MARGIN) : 0) }px`;
      this.tabContentEl.nextElementSibling.classList.remove("overflow-shadow");
    } else {
      this.tabContentEl.nextElementSibling.classList.add("overflow-shadow");
    }
  }

  createNewTabEl(url) {
    const div = document.createElement("div");
    div.innerHTML = tabTemplate;
    div.firstElementChild.setAttribute("url", url);
    return div.firstElementChild;
  }

  addTab(tabProperties) {
    if(tabProperties.url !== location.protocol + "//" + location.hostname + "/newtab.html" && !tabProperties.title) tabProperties.title = tabProperties.url;
    if(tabProperties.url !== location.protocol + "//" +  location.hostname +"/newtab.html") tabProperties.favicon = `https://www.google.com/s2/favicons?domain=${tabProperties.url}`;
    tabProperties = Object.assign({}, defaultTapProperties, tabProperties);
      
    const tabEl = this.createNewTabEl(tabProperties.url);

    if (tabProperties.animate) {
      tabEl.classList.add("chrome-tab-was-just-added");
      setTimeout(() => tabEl.classList.remove("chrome-tab-was-just-added"), 500);
    }

			window.onclick = hideContextMenu;
		var contextMenu1 = document.getElementById('contextMenu');
   
     contextMenu1.getElementsByTagName('ul')[0].getElementsByClassName('closeta')[0].addEventListener('click',function(){
          _browser_.chromeTabs.removeTab(tabEl)
    })

     contextMenu1.getElementsByTagName('ul')[0].getElementsByClassName('reloadta')[0].addEventListener('click',function(){
      const iframe = document.querySelector(".browser-tab-content-iframe[active]");
    if(iframe.getAttribute("loading") === "true") {
      iframe.contentWindow.stop();
      iframe.setAttribute("loading", false);
      iframe.setAttribute("sandbox", "");
    } else {
      iframe.contentWindow.location.reload();
      iframe.setAttribute("sandbox", "allow-downloads allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts");
    }
     })
       /*   contextMenu1.getElementsByTagName('ul')[0].getElementsByClassName('dupeta')[0].addEventListener('click',function(){
         var pog = tabEl.getAttribute('tabid');
              const iframe = document.querySelector(`.browser-tab-content-iframe[tabid='${pog}']`);
          
       
         
  var yayy = _browser_.chromeTabs.addTab({
    title: "Loading...",
    favicon: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F2%2F25%2FGoogle_Classroom_icon.svg%2F1200px-Google_Classroom_icon.svg.png&f=1&nofb=1", 

  }); 
                 const iframe2 = document.querySelector(`.browser-tab-content-iframe[tabid='${yayy}']`);
            iframe2.src = iframe.src;

                      

    
    })*/
	
			function showContextMenu (event) {
       
				contextMenu1.style.display = 'block';
				contextMenu1.style.left = event.clientX + 'px';
				contextMenu1.style.top = event.clientY + 'px';
       
    
				return false;
			}

			function hideContextMenu () {
				contextMenu1.style.display = 'none';
			}
 
			tabEl.addEventListener(
        "contextmenu",
        function (c) {
          c.preventDefault();
          showContextMenu(c);

        }, false);
     
    tabProperties = Object.assign({}, defaultTapProperties, tabProperties);
    this.tabContentEl.appendChild(tabEl);
    this.setTabCloseEventListener(tabEl);
    this.updateTab(tabEl, tabProperties);
    this.emit("tabAdd", { tabEl });
    if (!tabProperties.background) this.setCurrentTab(tabEl);
    this.cleanUpPreviouslyDraggedTabs();
    this.layoutTabs();
    this.setupDraggabilly();
  }

  setTabCloseEventListener(tabEl) {
    tabEl.querySelector(".chrome-tab-close").addEventListener("click", _ => this.removeTab(tabEl));
  }

  get activeTabEl() {
    return this.el.querySelector(".chrome-tab[active]");
  }

  hasActiveTab() {
    return !!this.activeTabEl;
  }

  setCurrentTab(tabEl) {
    const activeTabEl = this.activeTabEl;
    if (activeTabEl === tabEl) return;
    if (activeTabEl) activeTabEl.removeAttribute("active");
    tabEl.setAttribute("active", "");
    this.emit("activeTabChange", { tabEl });
  }

  removeTab(tabEl) {
     if(document.querySelectorAll('.chrome-tab').length == 1){
  
 
     
     
     return;
  } else {
    if (tabEl === this.activeTabEl) {
      if (tabEl.nextElementSibling) {
        this.setCurrentTab(tabEl.nextElementSibling);
      } else if (tabEl.previousElementSibling) {
        this.setCurrentTab(tabEl.previousElementSibling);
      }
    }
    tabEl.parentNode.removeChild(tabEl);
    this.emit("tabRemove", { tabEl });
    this.cleanUpPreviouslyDraggedTabs();
    this.layoutTabs();
    this.setupDraggabilly();
     }
  }

  updateTab(tabEl, tabProperties) {
    if(tabProperties.title) {
      tabEl.querySelector(".chrome-tab-title").textContent = tabProperties.title;
    }

    const faviconEl = tabEl.querySelector(".chrome-tab-favicon");
    
    if (tabProperties.favicon) {
      faviconEl.style.backgroundImage = `url("${ tabProperties.favicon }")`;
      faviconEl.removeAttribute("hidden", "");
    }

    if (tabProperties.id) {
      tabEl.setAttribute("data-tab-id", tabProperties.id);
    }
  }

  cleanUpPreviouslyDraggedTabs() {
    this.tabEls.forEach((tabEl) => tabEl.classList.remove("chrome-tab-was-just-dragged"));
  }

  setupDraggabilly() {
    const tabEls = this.tabEls;
    const tabPositions = this.tabPositions;

    if (this.isDragging) {
      this.isDragging = false;
      this.el.classList.remove("chrome-tabs-is-sorting");
      this.draggabillyDragging.element.classList.remove("chrome-tab-is-dragging");
      this.draggabillyDragging.element.style.transform = "";
      this.draggabillyDragging.dragEnd();
      this.draggabillyDragging.isDragging = false;
      this.draggabillyDragging.positionDrag = noop; // Prevent Draggabilly from updating tabEl.style.transform in later frames
      this.draggabillyDragging.destroy();
      this.draggabillyDragging = null;
    }

    this.draggabillies.forEach(d => d.destroy());

    tabEls.forEach((tabEl, originalIndex) => {
      const originalTabPositionX = tabPositions[originalIndex];
      const draggabilly = new Draggabilly(tabEl, {
        axis: "x",
        handle: ".chrome-tab-drag-handle",
        containment: this.tabContentEl
      });

      this.draggabillies.push(draggabilly);

      draggabilly.on("pointerDown", _ => {
        this.setCurrentTab(tabEl);
      })

      draggabilly.on("dragStart", _ => {
        this.isDragging = true;
        this.draggabillyDragging = draggabilly;
        tabEl.classList.add("chrome-tab-is-dragging");
        this.el.classList.add("chrome-tabs-is-sorting");
      })

      draggabilly.on("dragEnd", _ => {
        this.isDragging = false;
        const finalTranslateX = parseFloat(tabEl.style.left, 10);
        tabEl.style.transform = `translate3d(0, 0, 0)`;

        // Animate dragged tab back into its place
         requestAnimationFrame(_ => {
          tabEl.style.left = "0";
          tabEl.style.transform = `translate3d(${ finalTranslateX }px, 0, 0)`;

          requestAnimationFrame(_ => {
            tabEl.classList.remove("chrome-tab-is-dragging");
            this.el.classList.remove("chrome-tabs-is-sorting");

            tabEl.classList.add("chrome-tab-was-just-dragged");

            requestAnimationFrame(_ => {
              tabEl.style.transform = "";

              this.layoutTabs();
              this.setupDraggabilly();
            })
          })
        })
      })

      draggabilly.on("dragMove", (event, pointer, moveVector) => {
        // Current index be computed within the event since it can change during the dragMove
        const tabEls = this.tabEls;
        const currentIndex = tabEls.indexOf(tabEl);

        const currentTabPositionX = originalTabPositionX + moveVector.x;
        const destinationIndexTarget = closest(currentTabPositionX, tabPositions);
        const destinationIndex = Math.max(0, Math.min(tabEls.length, destinationIndexTarget));

        if (currentIndex !== destinationIndex) {
          this.animateTabMove(tabEl, currentIndex, destinationIndex);
        }
      })
    })
  }

  animateTabMove(tabEl, originIndex, destinationIndex) {
    if (destinationIndex < originIndex) {
      tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex]);
    } else {
      tabEl.parentNode.insertBefore(tabEl, this.tabEls[destinationIndex + 1]);
    }
    this.emit("tabReorder", { tabEl, originIndex, destinationIndex });
    this.layoutTabs();
  }
}

export default ChromeTabs;