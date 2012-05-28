var UI = function (storage) {
  this.listView_ = new ListView('filelist');
  this.listView_.navigationDelegate = this.navigateFromList.bind(this);
  this.storage_ = new Storage(this.storageInitalized_.bind(this));
  this.editor_ = new Editor('text');
};

UI.prototype = {
  storageInitalized_: function () {
    this.main_();
  },

  renderList: function () {
    this.storage_.list((function (files) {
      this.listView_.render(files, new Date()); 
      this.listView_.display();
      this.editor_.hide();
    }).bind(this));
  },

  navigateFromList: function(date) {
    this.listView_.hide();
    this.editor_.value = "OMGOMGOMG!" + date;
    this.editor_.update();
    this.editor_.display();
  },

  main_: function () {
    this.renderList();
  }
};
