Package.describe({
  summary: "Ordered traversable dictionary with a mutable ordering",
  meteor: "ordered-dict"
});

Package.all({
    files: ["ordered_dict"],
    exports: ["OrderedDict"]
});
