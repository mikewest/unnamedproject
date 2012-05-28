var UI = function (storage) {
  this.listView_ = new ListView('filelist');
  this.storage_ = new Storage(this.storageInitalized_.bind(this));
};

UI.prototype = {
  storageInitalized_: function () {
    this.main_();
  },

  renderList: function () {
    this.storage_.list((function (files) {
      this.listView_.render(files, new Date()); 
    }).bind(this));
  },

  main_: function () {
    this.renderList();
  }
};
