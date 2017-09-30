var c: HTMLCanvasElement = document.createElement("canvas"),
	ctx: CanvasRenderingContext2D = c.getContext("2d");

var WIDTH: number = 640,
	HEIGHT: number = 360;


class Entity{
	x: number = 0;
	y: number = 0;
	velX: number = 0;
	velY: number = 0;
	facing: number = 0;
	texture: Array<HTMLImageElement> = [new Image(), new Image()];
	show: Function = function(){
		ctx.drawImage(this.texture[this.facing], this.x-32 - Game.player.x+WIDTH/2-32, this.y-48, 64, 96);
	};
	update: Function = function(){
		this.x += this.velX;
		this.y += this.velY;
		// this.velY += Game.getLevel().gravityForce || 0.01;
	};
	checkCollision: Function = function(x: number, y: number){
		return !(this.x > x - 32 && this.x - 32 < x && this.y > y - 48 && this.y - 48 < y+8);
	};
	constructor(l: string, r: string, x: number, y: number){
		this.texture[0].src = l;
		this.texture[1].src = r;
		this.x = x;
		this.y = y;
	};
};
class Block extends Entity{
	w: number = 0;
	h: number = 0;
	checkCollision: Function = function(x: number, y: number){
		return !(this.x < x && this.x+this.w > x && this.y <= y && this.y+this.h+2 >= y);
	};
	show: Function = function(){
		ctx.drawImage(this.texture[0], this.x - Game.player.x+WIDTH/2-32, this.y, this.w, this.h);
	};
	constructor(x: number, y: number, w: number, h: number){
		super('block.png', 'block.png', x, y);
		this.w = w;
		this.h = h;
	}
};
class Decoration extends Entity{
	w: number = 0;
	h: number = 0;
	checkCollision: Function = function(x: number, y: number){
		return !(this.x < x && this.x+this.w > x && this.y <= y && this.y+this.h+2 >= y);
	};
	show: Function = function(){
		ctx.drawImage(this.texture[0], this.x - Game.player.x+WIDTH/2-32, this.y, this.w, this.h);
	};
	constructor(image: string, x: number, y: number, w: number, h: number){
		super(image, image, x, y);
		this.w = w;
		this.h = h;
	}
};
class Finish extends Entity{
	w: number = 0;
	h: number = 0;
	checkCollision: Function = function(x: number, y: number){
		return !(this.x < x && this.x+this.w > x && this.y <= y && this.y+this.h+2 >= y && !(Game.crLevel++,Game.refreshLevel()));
	};
	show: Function = function(){
		ctx.drawImage(this.texture[0], this.x - Game.player.x+WIDTH/2-32, this.y, this.w, this.h);
	};
	constructor(x: number){
		super('finish.png', 'finish.png', x, 0);
		this.w = 64;
		this.h = HEIGHT;
	}
};
class Player extends Entity{
	facing: number = 1;
	fuel: number = 100;
	velY: number = 2;
	jetpacking: boolean = false;
	jetpack: Function = function(){
		if(this.fuel<=5) return;
		this.fuel -= 2;
		this.velY -= 0.065;
		if(this.velY < -2) this.velY = -2;
	};
	update: Function = function(){
		var moveX: boolean = true;
		if(this.jetpacking) this.jetpack();
		if(this.velX < 0) this.facing = 0;
		else if(this.velX > 0) this.facing = 1;
		this.fuel += 0.35;
		for(var i in Game.entities) {
			if(!Game.entities[i].checkCollision(this.x+this.velX, this.y-2)) {
				// this.velX = 0;
				moveX = false; //If you are going to collide with an object if you go any lower, then do not do it!
			}
		}
		if(moveX) this.x += this.velX*2;
		if(this.fuel>=100) this.fuel = 99.9;
		for(var i in Game.entities) {
			if(!Game.entities[i].checkCollision(this.x, this.y+this.velY)) {
				this.velY = 0;
				return; //If you are going to collide with an object if you go any lower, then do not do it!
			}
		}
		this.velY += Game.getLevel().gravityForce || 0.02;
		this.y += this.velY;
	};
	show: Function = function(){
		// ctx.drawImage(this.texture[this.facing], this.x-32, this.y-96, 64, 96);
		ctx.drawImage(this.texture[this.facing], WIDTH/2-64, this.y-96, 64, 96);
		ctx.fillStyle = 'rgb(RED,GREEN,0)'
			.replace(/RED/g, (255-Math.floor(2.55*this.fuel)).toString())
			.replace(/GREEN/g, (Math.floor(2.55*this.fuel)).toString());
		ctx.fillRect(4,4,this.fuel,16);
	};
	constructor(){
		super("char_left.png", "char_right.png", WIDTH/5, HEIGHT/3);
	};
};

var Game = {
	loadFile: function(url){
		var request = new XMLHttpRequest();
		request.open('GET', url, false);
		request.send(null);
		return eval(request.responseText);
	},
	levels: new Array(32),
	crLevel: 0,
	getLevel: function(){
		return Game.levels[Game.crLevel];
	},
	player: new Player(),
	entities: [],
	framerate: 60,
	behindTheScenes: {
		lastFrame: new Date().getTime()
	},
	frame: function(){
		ctx.clearRect(0,0,WIDTH,HEIGHT)
		Game.framerate = Math.floor(1/((new Date().getTime() - Game.behindTheScenes.lastFrame)/10))/100;
		Game.behindTheScenes.lastFrame = new Date().getTime();
		Game.player.show();
		Game.player.update();
		for(var i in Game.entities) {
			Game.entities[i].show();
			Game.entities[i].update();
		}
		setTimeout(Game.frame, 1000/50);
	},
	refreshLevel: function(){
		Game.entities = Game.levels[Game.crLevel].entities;
		Game.player.x = WIDTH/5;
		Game.player.y = HEIGHT/3;
		Game.player.velX = 0;
		Game.player.velY = 1;
	},
	initialize: function(){
		c.width = WIDTH;
		c.height = HEIGHT;
		document.body.appendChild(c);
		ctx.imageSmoothingEnabled = false;
		for(var i = 0; i < Game.levels.length; i++) Game.levels[i] = Game.loadFile('levels/level'+(i+1)+'.json');
		Game.refreshLevel();
		Game.frame();
		for(var j in Game.dpad.buttons) Game.dpad.buttons[j].ontouchstart = Game.dpad.handlers.down[j];
		for(var j in Game.dpad.buttons) Game.dpad.buttons[j].onmousedown = Game.dpad.handlers.down[j];
		for(var j in Game.dpad.buttons) Game.dpad.buttons[j].ontouchend = Game.dpad.handlers.up[j];
		for(var j in Game.dpad.buttons) Game.dpad.buttons[j].onmouseup = Game.dpad.handlers.up[j];
	},
	keyhandler: {
		keydown: function(e){
			var key = e.keyCode || e.charCode || e.which || 0;
			if(key!=117&&key!=17&&key!=82) e.preventDefault();
			if(key == 38 || key == 87) Game.player.jetpacking = true;
			if(key == 65 || key == 37) Game.player.velX = -1;
			if(key == 68 || key == 39) Game.player.velX = +1;
		},
		keyup: function(e){
			var key = e.keyCode || e.charCode || e.which || 0;
			if(key!=117&&key!=17&&key!=82) e.preventDefault();
			if(key == 38 || key == 87) Game.player.jetpacking = false;
			if(key == 65 || key == 37) Game.player.velX = 0;
			if(key == 68 || key == 39) Game.player.velX = 0;
		}
	},
	dpad: {
		handlers: {
			down: {
				up: function(e){
					e.preventDefault();
					var temp = {keyCode: 38, charCode: 87, which: 38, preventDefault: function(){}};
					Game.keyhandler.keydown(temp);
				},
				left: function(e){
					e.preventDefault();
					var temp = {keyCode: 65, charCode: 37, which: 65, preventDefault: function(){}};
					Game.keyhandler.keydown(temp);
				},
				right: function(e){
					e.preventDefault();
					var temp = {keyCode: 68, charCode: 39, which: 68, preventDefault: function(){}};
					Game.keyhandler.keydown(temp);
				}
			},
			up: {
				up: function(e){
					e.preventDefault();
					var temp = {keyCode: 38, charCode: 87, which: 38, preventDefault: function(){}};
					Game.keyhandler.keyup(temp);
				},
				left: function(e){
					e.preventDefault();
					var temp = {keyCode: 65, charCode: 37, which: 65, preventDefault: function(){}};
					Game.keyhandler.keyup(temp);
				},
				right: function(e){
					e.preventDefault();
					var temp = {keyCode: 68, charCode: 39, which: 68, preventDefault: function(){}};
					Game.keyhandler.keyup(temp);
				}
			}
		},
		buttons: {
			up: document.querySelector('#up'),
			left: document.querySelector('#left'),
			right: document.querySelector('#right')
		}
	}
};

window.onkeydown = Game.keyhandler.keydown;
window.onkeyup   = Game.keyhandler.keyup;
window.onload = Game.initialize;