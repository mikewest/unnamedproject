var ListView = function (id) {
  this.list_ = document.getElementById(id);

  // Setup event handlers.
  this.list_.addEventListener('click', this.handleNavigation_.bind(this));
};

ListView.prototype = {
  navigationDelegate: function () {},
  handleNavigation_: function (e) {
    var target = e.target;
    while (target && target.nodeName !== 'A')
      target = target.parentNode;
    if (!target)
      return;
    e.preventDefault();
    e.stopPropagation();
    var date = this.getDate(target.href);
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
      data[date] = '<li><a href="' + files[i] + '" class="exists">' + date.match(/\d{2}$/)[0] + '<span>You wrote!</span></a></li>';
    }
    for (var i = 29; i >= 0; i--) {
      var cur = new Date(when.getFullYear(), when.getMonth(), when.getDate() - i,
                         12, 0, 0, 0);
      var strcur = this.getDate(cur.toJSON());
      if (data[strcur])
        html[html.length] = data[strcur];
      else if (i === 0)
        html[html.length] = '<li><a href="' + strcur + '.markdown" class="today">' + cur.getDate() + '</a></li>';
      else
        html[html.length] = '<li><a href="' + strcur + '.markdown">' + cur.getDate() + '</a></li>';
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
