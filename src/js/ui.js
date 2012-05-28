var UI = function (storage) {
  this.listView_ = new ListView('filelist');
  this.listView_.navigationDelegate = this.navigateFromList_.bind(this);

  this.editor_ = new Editor('text');
  this.editor_.persistanceDelegate = this.persistDocument_.bind(this);

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
    if (e.state === "list")
      this.showList_();
    else if (e.state)
      this.showEditor_(e.state);
    else
      this.showList_();
  },

  persistDocument_: function(text) {
    if (this.activeDocument_) {
      this.storage_.write(this.activeDocument_, text, (function () {
        this.storage_.saved_ = new Date();
      }).bind(this));
    }
  },



  main_: function () {
    this.listView_.hide();
    this.editor_.hide();
    this.showList_();
  }
};
