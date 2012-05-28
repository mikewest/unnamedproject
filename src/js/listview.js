var ListView = function (id) {
  this.list_ = document.getElementById(id);

  // Setup event handlers.
  this.list_.addEventListener('click', this.handleNavigation_.bind(this));
};

ListView.prototype = {
  navigationDelegate: function () {},
  handleNavigation_: function (e) {
    if (e.target.nodeName !== 'A')
      return;
    e.preventDefault();
    e.stopPropagation();
    var date = this.getDate(e.target.href);
    this.navigationDelegate(date);
  },

  getDate: function (filename) {
    return filename.match(/\d{4}-\d{2}-\d{2}/)[0];
  },
  render: function (files, when) {
    var data = {};
    var html = [];
    when = new Date(when.getFullYear(), when.getMonth(), when.getDate(), 12, 0, 0, 0);
    for (var i = 0; i < files.length; i++) {
      var date = this.getDate(files[i]);
      data[date] = '<li><a href="' + files[i] + '" class="exists">' + files[i] + '</a></li>';
    }
    for (var i = 30; i >= 0; i--) {
      var cur = new Date(when.getFullYear(), when.getMonth(), when.getDate() - i,
                         12, 0, 0, 0);
      var strcur = this.getDate(cur.toJSON());
      if (data[strcur])
        html[html.length] = data[strcur];
      else
        html[html.length] = '<li><a href="' + strcur + '.markdown">' + strcur + '</a></li>';
    }
    this.list_.innerHTML = html.join('');
  },

  display: function () {
    this.list_.parentNode.classList.add('active');
  },
  hide: function () {
    this.list_.parentNode.classList.remove('active');
  },
};
