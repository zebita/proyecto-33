class Platform {
    constructor(x,y,width,height) {
      var options = {
          isStatic: true
      }
      this.body = Bodies.rectangle(x,y,width,height,options);
      this.width = width;
      this.height = height;
      World.add(world, this.body);
      this.image = loadImage("sprites/tierra1.png")
    }
    display(){
        image(this.image, 700,100,150,60); 
      var pos =this.body.position; 
    }
  };