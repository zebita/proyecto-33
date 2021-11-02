class Zombie extends Base {
    constructor(x, y) {
    super(x,y,80,80);
    this.Visibility = 255;
    this.image = loadImage("sprites/zombie2.png");
  }

   display(){
     //console.log(this.body.speed);
     if (this.body.speed < 3){
       super.display();
     }      
     else {
       World.remove(world,this.body);
       push();
       this.Visibility = this.Visibility -5;
      tint(255,this.Visibility);
      image(this.image, this.body.position.x,this.body.position.y,50,50);
      pop();
    }
   }

 score(){
   if(this.Visibility<0 && this.Visibility> -1005){
    score++;
   }
 }

}