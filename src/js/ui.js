var UI = function (storage) {
  this.listView_ = new ListView('filelist');
  this.listView_.navigationDelegate = this.navigateFromList_.bind(this);

  this.editor_ = new Editor('text');
  this.editor_.onpersist = this.persistDocument_.bind(this);
  this.editor_.onclose = this.navigateFromEditor_.bind(this);

  this.storage_ = new Storage(this.storageInitalized_.bind(this));
};

UI.prototype = {
  storageInitalized_: function () {
    window.addEventListener('popstate', this.popState_.bind(this));
    this.main_();
  },

  navigateFromList_: function(date) {
    history.pushState(date, date, "/" + date + "/");
    this.showEditor_(date);
  },

  navigateFromEditor_: function() {
    history.pushState('/', '/', '/');
    this.showList_();
  },

  showEditor_: function (date) {
    // Hide the list view; while that's animating...
    this.listView_.hide();

    // Read the file data:
    this.activeDocument_ = filename = date + '.markdown';
    this.storage_.read(filename, (function (text) {
      this.editor_.value = text;
      this.editor_.update();
      this.editor_.display();
    }).bind(this));
  },

  showList_: function () {
    this.editor_.hide();

    this.storage_.list((function (files) {
      this.listView_.render(files, new Date());
      this.listView_.display();
    }).bind(this));
  },

  popState_: function (e) {
    if (e.state === "/")
      this.showList_();
    else if (e.state)
      this.showEditor_(e.state);
    else
      this.main_();
  },

  persistDocument_: function(text, download) {
    if (this.activeDocument_) {
      this.storage_.write(this.activeDocument_, text, (function () {
        this.storage_.saved_ = new Date();
        if (download) {
          this.storage_.getFileURL(this.activeDocument_, (function (url) {
            var a = document.createElement('a');
            a.setAttribute('download', this.activeDocument_);
            a.href = url;
            var event = document.createEvent("MouseEvents");
            event.initMouseEvent(
              "click", true, false, a, 0, 0, 0, 0, 0
              , false, false, false, false, 0, null);
            return a.dispatchEvent(event);
          }).bind(this));
        }
      }).bind(this));
    }
  },



  main_: function () {
    this.listView_.hide();
    this.editor_.hide();

    this.showEditor_('2012-03-13');
  }
};
