Package.describe({
  summary: "Ordered traversable dictionary with a mutable ordering",
  meteor: true
});

Package.all({
    files: ["ordered_dict"],
    exports: ["OrderedDict"]
});
