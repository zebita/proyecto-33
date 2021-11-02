const Engine = Matter.Engine;
const World= Matter.World;
const Bodies = Matter.Bodies;
const Constraint = Matter.Constraint;

var engine, world;
var box1, zombie1;
var backgroundImg,platform,platform2,platform3;
var platformimg;
var calabaza, resortera;
var score = 0;
var estadodejuego = "onSling";

function preload() {
  backgroundImg = loadImage("sprites/bg.png");
  platformimg = loadImage("sprites/tierra1.png")
}

function setup() {
  createCanvas(1000,500);
  engine = Engine.create();

  world = engine.world;

  box1 = new Box(650,300,55,55);

  box2 = new Box(700,115,55,55);

  platform = new Ground(500,425,1000,28);

  platform2 = new Platform(750,122,150,30)

  calabaza = new Calabaza(200,50);

  zombie1 = new Zombie(750,390);

  zombie2 = new Zombie(767,115);

  resortera = new Resortera(calabaza.body, {x: 150 , y: 250});
}

function draw() {
  if(backgroundImg){
    background(backgroundImg);

    text("score" + score, 200, 50);    
}

  Engine.update(engine);

  platform.display();

  platform2.display();

  zombie1.score();
  zombie2.score();
  zombie1.display();
  zombie2.display();
  
  resortera.display();

  calabaza.display();

  box1.display();
  box2.display();
}

function mouseDragged(){
  if(estadodejuego !=="launched"){
   Matter.Body.setPosition(calabaza.body,{x: mouseX, y: mouseY});
}
}

function mouseReleased(){
   resortera.fly();
   estadodejuego="launched";
}

function keyPressed(){
  if(keyCode === 32 && calabaza.body.speed < 1){
    calabaza.trayectoria = []
    Matter.Body.setPosition(calabaza.body, {x:200,y:50})
    resortera.attach(calabaza.body)
    estadodejuego = "onSling";
  } 
}