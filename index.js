
/**
 * @name ModSynth
 */
 
var time;

function sineWave(t, f) {
  return Math.sin(Math.PI*2*t*f);
}

function squareWave(t, f) {
  if((t*f)%1<0.5)
    return -1;
  else
    return 1;
}

function sawWave(t, f) {
  return 2*((t*f)%1)-1;
}

class Output {
  constructor() {
    this.out;
  }
}

class Oscillator {
  constructor(baseF, shiftF, gainF) {
    this.baseF=baseF;
    this.shiftF=shiftF;
    this.gainF=gainF;
    this.sineOut=new Output();
    this.squareOut=new Output();
    this.sawOut=new Output();
  }
  
  update() {
    var freq=baseF;
    if(shiftF)
    {
      freq+=shiftF.out*gainF;
    }
    sineOut.out=sineWave(time, freq);
    squareOut.out=squareWave(time, freq);
    sawOut.out=sawWave(time, freq);
  }
  
}

class Mixer {
  
}

class Speaker {
  constructor(In) {
    this.In=In;
  }
}

class Modules {
  constructor() {
    this.modList=[]
  }
  
  updateAll() {
    modList.forEach(function(a) {
      a.update();
    });
  }
  
  addModule(mod) {
    modList.push(mod);
  }
}

export function dsp(t) {
  time=t;
  
  
  return 0;
}

