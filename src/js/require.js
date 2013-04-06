/**
 * @author: Sofish Lin
 * @site: http://sofish.de
 * @license: MIT
 */

var marked, Clipboard, GUI, Tray;

// make a referrence to GUI
GUI = require('nw.gui');

// markdown parser
marked = require('marked');
marked.setOptions({
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  langPrefix: 'lang-',
  highlight: function(code, lang) {
    return code;
  }
});


// access clipboard
Clipboard = GUI.Clipboard.get();

/*
// Create an empty Menu
Menu = new GUI.Menu({ type: 'menubar'});

// Add some items
Menu.append(new GUI.MenuItem({ label: 'Open a File' }));
Menu.append(new GUI.MenuItem({ label: 'Open recent...'}));
Menu.append(new GUI.MenuItem({ type: 'separator' }));
Menu.append(new GUI.MenuItem({ label: 'Help' }));

// Create a tray icon
Tray = new GUI.Tray({icon: 'img/tray.png'});
Tray.menu = Menu;
*/
