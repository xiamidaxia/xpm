LocalCollection._IdMap = function () {
  var self = this;
  IdMap.call(self, LocalCollection._idStringify, LocalCollection._idParse);
};

_.extend(LocalCollection._IdMap.prototype, IdMap.prototype);

