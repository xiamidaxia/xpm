Package.describe({
  summary: "Ordered traversable dictionary with a mutable ordering",
  meteor: "0.8.1.3"
});

Package.all({
    files: ["ordered_dict"],
    exports: ["OrderedDict"]
});
