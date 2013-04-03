var marked, Clipboard, GUI;

// make a referrence to gui
GUI = require('nw.gui');

// markdown parser
marked = require('marked');
marked.setOptions({
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  langPrefix: 'lang-',
  highlight: function(code, lang) {
    return code;
  }
});


// access clipboard
Clipboard = GUI.Clipboard.get();