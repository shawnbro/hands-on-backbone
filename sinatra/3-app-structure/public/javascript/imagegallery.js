var ImageGallery = {};

ImageGallery.vent = _.extend({}, Backbone.Events);

ImageGallery.Image = Backbone.Model.extend({
  select: function(){
    if (this.get("selected")) return;
    this.set({selected: true});
    this.collection.select(this);
    ImageGallery.vent.trigger("image:selected", this);
  },

  deselect: function(){
    this.unset("selected");
  }
});

ImageGallery.ImageCollection = Backbone.Collection.extend({
  model: ImageGallery.Image,

  initialize: function(){
    ImageGallery.vent.bind("image:previous", this.previousImage, this);
    ImageGallery.vent.bind("image:next", this.nextImage, this);
  },

  previousImage: function(){
    var index = this.indexOf(this.selectedImage);
    if (index > 0){
      index -= 1;
    } else {
      index = this.length - 1;
    }
    var image = this.at(index);
    image.select();
  },

  nextImage: function(){
    var index = this.indexOf(this.selectedImage);
    if (index < this.length - 1){
      index += 1;
    } else {
      index = 0;
    }
    var image = this.at(index);
    image.select();
  },

  select: function(image){
    this.deselect();
    this.selectedImage = image;
  },

  deselect: function(){
    if (this.selectedImage){
      this.selectedImage.deselect();
      delete this.selectedImage;
    }
  }
});

ImageGallery.AddImageView = Backbone.View.extend({
  id: "add-image-form",
  template: "#add-image-template",

  events: {
    "change #name": "nameChanged",
    "change #description": "descriptionChanged",
    "change #url": "urlChanged",
    "click #save": "saveImage"
  },

  nameChanged: function(e){
    var value = $(e.currentTarget).val();
    this.model.set({name: value});
  },

  descriptionChanged: function(e){
    var value = $(e.currentTarget).val();
    this.model.set({description: value});
  },

  urlChanged: function(e){
    var value = $(e.currentTarget).val();
    this.model.set({url: value});
    this.$("#preview").attr("src", value);
  },

  saveImage: function(e){
    e.preventDefault();

    var name = this.model.get("name");
    var desc = this.model.get("description");
    var url = this.model.get("url");

    this.collection.add(this.model);
  },

  render: function(){
    var html = $(this.template).tmpl();
    $(this.el).html(html);
  }
});

ImageGallery.ImageListView = Backbone.View.extend({
  tagName: "ul",

  initialize: function(){
    _.bindAll(this, "renderImage");
    this.collection.bind("add", this.renderImage, this);
  },

  renderImage: function(image){
    var imagePreview = new ImageGallery.ImagePreview({
      model: image
    });
    imagePreview.render();
    $(this.el).prepend(imagePreview.el);
  },

  render: function(){
    this.collection.each(this.renderImage);
  }
});

ImageGallery.ImagePreview = Backbone.View.extend({
  template: "#image-preview-template",

  events: {
    "click a": "imageClicked",
  },

  initialize: function(){
    this.template = $(this.template);
    this.model.bind("change:selected", this.imageSelected, this);
  },

  imageSelected: function(){
    this.$("img").toggleClass("selected");
  },

  imageClicked: function(e){
    e.preventDefault();
    this.model.select();
  },

  render: function(){
    var html = this.template.tmpl(this.model.toJSON());
    $(this.el).html(html);
  }
});

ImageGallery.ImageView = Backbone.View.extend({
  template: "#image-view-template",
  className: "image-view",

  events: {
    "click .nav-previous a": "previousImage",
    "click .nav-next a": "nextImage"
  },

  previousImage: function(e){
    e.preventDefault();
    ImageGallery.vent.trigger("image:previous");
  },

  nextImage: function(e){
    e.preventDefault();
    ImageGallery.vent.trigger("image:next");
  },

  render: function(){
    var html = $(this.template).tmpl(this.model.toJSON());
    $(this.el).html(html);
  }
});

ImageGallery.Router = Backbone.Router.extend({
  routes: {
    "": "newImage",
    "images/new": "newImage",
    "images/:id": "showImage"
  },

  initialize: function(options){
    this.collection = options.collection;
  },
  
  showImage: function(id){
    var image = this.collection.get(id);
    image.select();
    ImageGallery.showImage(image);
  },

  newImage: function(){
    ImageGallery.addImage(this.collection);
  }
});

ImageGallery.addImage = function(images){
  images.deselect();

  var image = new ImageGallery.Image();
  var addImageView = new ImageGallery.AddImageView({
    model: image,
    collection: images
  });
  addImageView.render();

  $("#main").html(addImageView.el);
}

ImageGallery.showImage = function(image){
  var imageView = new ImageGallery.ImageView({
    model: image
  });
  imageView.render();
  $("#main").html(imageView.el);
}

$(function(){
  var imageData = [
    {
      id: 1,
      url: "/images/islands.jpeg",
      name: "Some island",
      description: "Some islands at sunset"
    },
    {
      id: 2,
      url: "/images/mountain.jpeg",
      name: "A mountain",
      description: "A mountain with a grassy hill and tree in front of it"
    },
    {
      id: 3,
      url: "/images/wrench.jpeg",
      name: "A rusty wrench",
      description: "A close up view of a rusty wrence, with great color and texture on it"
    },
    {
      id: 4,
      url: "/images/flower.jpeg",
      name: "A purple flower",
      description: "A purple flower with a water drop hanging off another plant"
    },
  ];

  var images = new ImageGallery.ImageCollection(imageData);

  images.bind("add", function(){
    ImageGallery.addImage(images);
  });

  ImageGallery.vent.bind("image:selected", function(image){
    ImageGallery.showImage(image);
    router.navigate("images/" + image.id);
  });

  var imageListView = new ImageGallery.ImageListView({
    collection: images
  });
  imageListView.render();

  $("#image-list").html(imageListView.el);

  var router = new ImageGallery.Router({
    collection: images
  });

  Backbone.history.start();

});
