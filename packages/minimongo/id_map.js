LocalCollection._IdMap = function () {
  var self = this;
  IdMap.call(self, LocalCollection._idStringify, LocalCollection._idParse);
};
console.log(IdMap)
//Meteor._inherits(LocalCollection._IdMap, IdMap);

