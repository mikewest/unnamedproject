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
  this.editor_.addEventListener('keyup', this.update.bind(this));

  // Kick things off by focusing on the editor, and running a style update.
  this.editor_.focus();
  this.update();
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

  /**
   * One or two characters cause issues; this function triggers on `keydown`
   * in order to work around them.
   *
   * @param {!KeyboardEvent} e The keyboard event that we're responding to.
   */
  preprocessKeystroke_: function (e) {
    if (e.keyCode === 13) { // ENTER
      e.preventDefault();
      e.stopPropagation();
      if (window.getSelection) {
        var selection = window.getSelection();
        var range = selection.getRangeAt(0);
        range.insertNode(document.createTextNode('\n'));
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
    if (window.getSelection) {
      var selection = window.getSelection();
      var range = selection.getRangeAt(0);
      range.insertNode(document.createTextNode('{{ CARETMARKER }}'));
    }

    var text = this.editor_.innerText;
    this.updateCount_(text);
    this.editor_.innerHTML = this.processText_(text);
    this.resetCaret_();
  },

  /**
   * Given a string, generate a naïve word and character count for the UI.
   *
   * @param {!String} text The text we're counting.
   * @private
   */
  updateCount_: function (text) {
    var cur = text.replace(/^---\s[\S\s]+?\s---\s/, '');
    this.wordcount_.innerText = cur.split(/ /).length;
    this.charcount_.innerText = cur.split('').length;
  },

  /**
   * Given a string formatted with some reasonable subset of Markdown, do some
   * light processing work to convert into HTML for pretty rendering.
   *
   * @return {String} The processed text (in HTML format).
   * @private
   */
  processText_: function (text) {
    var replacement = [
      // & and < and > => &amp; and &lt; and &gt;
      [/\&/gi, '&amp;'],
      [/\</gi, '&lt;'],
      [/\>/gi, '&gt;'],

      // Caret replacement.
      [/{{ CARETMARKER }}/, '<mark id="caretmarker"></mark>'],

      // _italic_ => <em>_italic_</em>
      [/(^|[\s\[])_([^_\s]+(?:(?:_[^_\s]+)*))_(?=$|[\s\.;:<,\]])/gi, '$1<em>&#x5f;$2&#x5f;</em>'],
      [/(^|[\s\[])_(.+?)_(?=$|[\s\.;:<,\]])/gi, '$1<em>&#x5f;$2&#x5f;</em>'],

      // **bold** => <strong>bold</strong>
      [/(^|[\s\[])\*\*([^\*\s]+(?:(?:\*\*[^*\s]+)*))\*\*(?=$|[\s\.;:<,\]])/gi, '$1<strong>&#x2a;&#x2a;$2&#x2a;&#x2a;</strong>'],
      [/(^|[\s\[])\*\*(.+?)\*\*(?=$|[\s\.;:<,\]])/gi, '$1<strong>&#x2a;&#x2a;$2&#x2a;&#x2a;</strong>'],

      // `code` => <code>`italic`</code>
      [/(^|[\s\[])`([^\`]+?)`(?=$|[\s\.;:<,\]])/gi, '$1<code>&#x60;$2&#x60;</code>'],
    ];
    for (var i = 0; i < replacement.length; i++)
      text = text.replace(replacement[i][0], replacement[i][1]);
    return '<pre>' + text + '</pre>';
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
    range.setStart(caret, 0);

    var selection = window.getSelection();
    range.collapse(false);
    range.deleteContents();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
