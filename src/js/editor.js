/**
 * This class manages the editor widget, which is less complex and glamourous
 * than it sounds.
 *
 * @param {!string} editorID The ID of the editor element on the page.
 * @constructor
 */
var Editor = function(editorID) {
  // Cache DOM references.
  this.editor_ = document.getElementById(editorID);
  this.wordcount_ = document.getElementById('wordcount');
  this.charcount_ = document.getElementById('charcount');

  // Setup event listeners.
  this.editor_.addEventListener('keydown', this.preprocessKeystroke_.bind(this));
  this.editor_.addEventListener('keyup', this.setNeedsUpdate_.bind(this));

  document.getElementById('close').addEventListener('click', (function () {
    this.onclose();
  }).bind(this));
  document.getElementById('download').addEventListener('click', (function () {
    this.onpersist(this.editor_.innerText, true);
  }).bind(this));
  document.getElementById('fullscreen').addEventListener('click', (function () {
    if (document.body.webkitRequestFullScreen)
      document.body.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    if (document.body.mozRequestFullScreen)
      document.body.mozRequestFullScreen();
  }).bind(this));

  var timer = (function () {
    window.webkitRequestAnimationFrame(timer);
    if (this.needsUpdate_)
      this.update();
  }).bind(this);
  window.webkitRequestAnimationFrame(timer);

  // Kick things off by focusing on the editor and running a style update.
  this.editor_.focus();
  this.update();
  this.timer_ = null;
};

Editor.prototype = {
  /**
   * Cached reference to the editor's DOM element.
   *
   * @type {DOMElement}
   * @private
   */
  editor_: null,

  /**
   * Cached reference to the editor's charcount element.
   *
   * @type {DOMElement}
   * @private
   */
  charcount_: null,

  /**
   * Cached reference to the editor's wordcount element.
   *
   * @type {DOMElement}
   * @private
   */
  wordcount_: null,

  onclose: function () {},
  onpersist: function () {},

  set value(text) {
    this.editor_.innerText = text;
    this.update();
  },

  get value() {
    return this.editor_.innerText;
  },

  setNeedsUpdate_: function (e) {
                     console.log(e.keyCode);
    if (e.keyCode === 16 || // Shift
        e.keyCode === 17 || // Ctrl
        e.keyCode === 18 || // Alt
        e.keyCode === 91 || // Command
        e.keyCode === 93 || // Other command.
        (e.keyCode >= 37 && e.keyCode <= 40)) // Arrow keys
      return;
    if (e.keyCode === 27) // Esc
      return this.onclose();
    this.needsUpdate_ = true;
  },

  /**
   * One or two characters cause issues; this function triggers on `keydown`
   * in order to work around them.
   *
   * @param {!KeyboardEvent} e The keyboard event that we're responding to.
   */
  preprocessKeystroke_: function (e) {
    if (e.keyCode === 83 && e.metaKey) { // command-s
      e.preventDefault();
      e.stopPropagation();
      this.onpersist(this.editor_.innerText, true);
      return;
    }
    if (e.keyCode === 8) { // BACKSPACE
      if (window.getSelection) {
        var selection = window.getSelection();
        var range = selection.getRangeAt(0);
        // Don't delete our way out of the root element.
        if (!range.endOffset && !range.startOffset &&
            range.startContainer === this.editor_) {
          e.preventDefault();
          e.stopPropagation();
        }
        // Don't get stuck on the cursor.
        if (range.startContainer.id === 'caretmarker') {
          range.setStartBefore(range.startContainer);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      return;
    }
    if (e.keyCode === 9) { // TAB
      e.preventDefault();
      e.stopPropagation();
      if (window.getSelection) {
        var selection = window.getSelection();
        var range = selection.getRangeAt(0);
        range.insertNode(document.createTextNode('  '));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    if (e.keyCode === 13) { // ENTER
      e.preventDefault();
      e.stopPropagation();
      if (window.getSelection) {
        var selection = window.getSelection();
        var range = selection.getRangeAt(0);
        range.insertNode(document.createElement('br'));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  },

  /**
   * Run the update process for the editor. The expectation is that this method
   * will execute after `keyup` to process the text as it currently exists. At
   * the moment, it's incredibly inefficient. If that becomes a problem, I'll
   * rework it, but since this is more or less optimized for ~500 word strings,
   * I'm not terribly worried about performance.
   *
   * @param {!KeyboardEvent} e The keyboard event that we're responding to.
   */
  update: function (e) {
    this.needsUpdate_ = false;

    this.saveCaret_();
    this.editor_.innerHTML = this.processText_(this.value);
    this.resetCaret_();
    this.updateCount_(this.value);
  },

  /**
   * Given a string, generate a naïve word and character count for the UI.
   *
   * @param {!String} text The text we're counting.
   * @private
   */
  updateCount_: function (text) {
    var cur = text.replace(/^---\s[\S\s]+?\s---\s/, '');
    this.charcount_.innerText = cur.split('').length;
    if (this.charcount_.innerText === "0") 
      this.wordcount_.innerText = '0';
    else
      this.wordcount_.innerText = cur.split(/ /).length;
  },

  /**
   * Given a string formatted with some reasonable subset of Markdown, do some
   * light processing work to convert into HTML for pretty rendering.
   *
   * @return {String} The processed text (in HTML format).
   * @private
   */
  processText_: function (text) {
    // Things are simpler if text ends with a newline.
    if (text.match(/\S$/))
      text += "\n";
    var replacement = [
      // & and < and > => &amp; and &lt; and &gt;
      [/\&/gi, '&amp;'],
      [/\</gi, '&lt;'],
      [/\>/gi, '&gt;'],

      // Caret replacement.
      [/{{ CARETBEGIN }}/, '<mark id="caretmarker">'],
      [/{{ CARETEND }}/, '</mark>'],

      // _italic_ => <em>_italic_</em>
      [/(^|[\s\[])_([^_\s]+(?:(?:_[^_\s]+)*))_(?=$|[\s\.;:<,\]])/gi, '$1<em><s>&#x5f;</s>$2<s>&#x5f;</s></em>'],
      [/(^|[\s\[])_(.+?)_(?=$|[\s\.;:<,\]])/gi, '$1<em><s>&#x5f;</s>$2<s>&#x5f;</s></em>'],

      // **bold** => <strong>bold</strong>
      [/(^|[\s\[])\*\*([^\*\s]+(?:(?:\*\*[^*\s]+)*))\*\*(?=$|[\s\.;:<,\]])/gi, '$1<strong><s>&#x2a;&#x2a;</s>$2<s>&#x2a;&#x2a;</s></strong>'],
      [/(^|[\s\[])\*\*(.+?)\*\*(?=$|[\s\.;:<,\]])/gi, '$1<strong><s>&#x2a;&#x2a;</s>$2<s>&#x2a;&#x2a;</s></strong>'],

      // `code` => <code>`italic`</code>
      [/(^|[\s\[])`([^\`]+?)`(?=$|[\s\.;:<,\]])/gi, '$1<code><s>&#x60;</s>$2<s>&#x60;</s></code>'],

      // # Header => # <strong>Header</strong>
      [/(^|\n)(#+\s+)([^\n]+)/gi, '$1$2<strong class=\'hx\'>$3</strong>'],

      // [link](omg) => [<a href="omg">link</a>](omg)
      [/\[([^\]]+)\]\(([^\)]+)\)/, '<s>&#x5b;</s><a href=\'$2\'>$1</a><s>&#x5d;&#x28;$2&#x29;</s>'],

      // Leading whitespace === teh awesome!
      [/\n/g, '<br>'],
    ];
    for (var i = 0; i < replacement.length; i++)
      text = text.replace(replacement[i][0], replacement[i][1]);
    return '<pre>' + text + '</pre>';
  },

  /**
   * Save the caret position by inserting `CARETMARKER`.
   *
   * @private
   */
  saveCaret_: function () {
    // If we're not focused, focus.
    this.editor_.focus();
    if (window.getSelection) {
      var selection = window.getSelection();
      var range = selection.getRangeAt(0);
      range.insertNode(document.createTextNode('{{ CARETBEGIN }}{{ CARETEND }}'));
    }
  },

  /**
   * Given a document that contains a `#caretmarker`, remove that element and
   * set the caret to it's previous position.
   *
   * @private
   */
  resetCaret_: function () {
    var caret = document.querySelector('#caretmarker');
    var range = document.createRange();
    range.setStartBefore(caret);
    range.setEndAfter(caret);
    range.deleteContents();
    range.collapse(false);

    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  },

  display: function () {
    this.editor_.parentNode.classList.add('active');
    this.timer_ = setInterval((function () {
      this.onpersist(this.editor_.innerText);
    }).bind(this), 5000);
  },
  hide: function () {
    clearInterval(this.timer_);
    this.editor_.blur();
    this.editor_.parentNode.classList.remove('active');
    this.onpersist(this.editor_.innerText);
  },
}
