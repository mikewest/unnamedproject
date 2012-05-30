/**
 * This class manages storage and retrieval of documents.
 *
 * @param {?Function} callback Optional callback, triggered when
 *     initialization is complete.
 * @constructor
 */
var Storage = function (initCallback) {
  this.initCallback_ = initCallback;

  var requestFS = window.requestFileSystem || 
                  window.mozRequestFileSystem ||
                  window.webkitRequestFileSystem;
  requestFS(window.TEMPORARY, 10*1024*1024 /*10MB*/, this.onInitFS_.bind(this),
      this.onFSError_.bind(this));
};

Storage.prototype = {
  /**
   * Cached handle to the file system.
   *
   * @type {?FileSystem}
   * @private
   */
  fs_: null,

  /**
   * Callback to handle successful initialization of the filesystem. A handle
   * will be stored off into `this.fs_`, and a `Documents` directory will be
   * created.
   *
   * @param {!FileSystem} fileSystem The file system.
   * @private
   */
  onInitFS_: function (fileSystem) {
    this.fs_ = fileSystem;
    this.fs_.root.getDirectory('Documents', {create: true},
        this.onGotDocuments_.bind(this), this.onFSError_.bind(this));
  },

  /**
   * Callback to handle successfully grabbing the the Documents directory. A
   * handle will be stored in `this.docroot_` for later use.
   *
   * @param {!DirectoryEntry} dirEntry The `Documents` directory.
   * @private
   */
  onGotDocuments_: function (dirEntry) {
    this.docroot_ = dirEntry;
    if (this.initCallback_)
      this.initCallback_();
  },

  onFSError_: function (error) {
    var msg = '';
    
    switch (error.code) {
      case FileError.QUOTA_EXCEEDED_ERR:
        msg = 'QUOTA_EXCEEDED_ERR';
        break;
      case FileError.NOT_FOUND_ERR:
        msg = 'NOT_FOUND_ERR';
        break;
      case FileError.SECURITY_ERR:
        msg = 'SECURITY_ERR';
        break;
      case FileError.INVALID_MODIFICATION_ERR:
        msg = 'INVALID_MODIFICATION_ERR';
        break;
      case FileError.INVALID_STATE_ERR:
        msg = 'INVALID_STATE_ERR';
        break;
      default:
        msg = 'Unknown Error';
        break;
    };

    console.log('Oh noes! Error:' + msg);
  },

  /**
   * Opens (and creates if necessary) a document, and calls `callback` with its
   * contents.
   *
   * @param {!String} name The document to open.
   * @param {!Function} callback A callback function to execute on success.
   */
  read: function (name, callback) {
    this.docroot_.getFile(
        name, 
        {create: true, exclusive: false},
        (function (fileEntry) {
          fileEntry.file(function (openedFile) {
            var reader = new FileReader();
            reader.onloadend = function () {
              callback(this.result);
            };
            reader.readAsText(openedFile);
          }, this.onFSError_.bind(this));
        }).bind(this),
        this.onFSError_.bind(this));
  },

  getFileURL: function (name, callback) {
    this.docroot_.getFile(
        name,
        {create:false},
        (function (fileEntry) {
          callback(fileEntry.toURL());
        }).bind(this),
        this.onFSError_.bind(this));
  },

  /**
   * Opens (and creates if necessary) a document, writes |text| into it, and
   * calls `callback` when finished.
   *
   * @param {!String} name The document to open.
   * @param {!String} text The text to write into the document.
   * @param {!Function} callback Success callback.
   */
  write: function (name, text, callback) {
    this.docroot_.getFile(
        name, 
        {create: true, exclusive: false},
        (function (fileEntry) {
          fileEntry.createWriter(function (writer) {
            writer.onwriteend = function (e) {
              callback(true);
            };
            writer.onerror = function (e) {
              callback(false);
            };
            
            var bb;
            if (window.BlobBuilder)
              bb = new BlobBuilder();
            else if (window.MozBlobBuilder)
              bb = new MozBlobBuilder();
            else if (window.WebKitBlobBuilder)
              bb = new WebKitBlobBuilder();

            bb.append(text);
            writer.write(bb.getBlob('text/plain'));
          });
        }).bind(this),
        this.onFSError_.bind(this));
  },

  /**
   * Lists files available in storage.
   *
   * @param {!Function} callback Callback once list is generated.
   */
  list: function (callback) {
    var dirReader = this.docroot_.createReader();
    var entries = [];
    var readEntries = function () {
      dirReader.readEntries(function (results) {
        if (!results.length) {
          callback(entries.sort());
        } else {
          for (var i = 0; i < results.length; i++)
            entries[entries.length] = results[i].name;
          readEntries();
        }
      });
    };
    readEntries();
  }
};
