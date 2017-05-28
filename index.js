
/**
 * @name ModSynth
 */
//Global variables 
var time=0;


//Global functions
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


//Helper classes
class Output {
  constructor() {
    this.out;
  }
}

//Modules
class Sequencer {
  constructor(sequences, pattern, bpm) {
    this.sequences=sequences;
    this.pattern=pattern;
    this.bpm=bpm;
  }
  
}

class Filter {
  
}

class Amplifier {
  constructor(In, baseA, shiftA, gainA) {
    this.In=In;
    this.baseA=baseA;
    this.shiftA=shiftA;
    this.gainA=gainA;
    this.modulatedOut=new Output();
    this.multipliedOut=new Output();
  }
  update() {
    var a=this.baseA;
    if(this.shiftA)
      a+=this.shiftA.out*this.gainA;
    if(a>=0)
      a+=1;
    else
      a=-1/(a-1);
    if(this.In) {
      if(this.In.out<0) {
        this.modulatedOut.out=-Math.pow(-this.In.out, a);
      }
      else
        this.modulatedOut.out=Math.pow(this.In.out, a);
      this.multipliedOut.out=this.In.out*a;
    } else {
      this.multipliedOut.out=0;
      this.modulatedOut.out=0;
    }
  }
}

class Capacitor {
  constructor(In, baseC, shiftC, gainC) {
    this.In=In;
    this.baseC=baseC;
    this.shiftC=shiftC;
    this.gainC=gainC;
    this.out=new Output();
    this.out.out=0;
  }
  update() {
    var c=this.baseC;
    if(this.shiftC)
      c+=this.shiftC.out*this.gainC;
    if(this.In)
      this.out.out+=(this.In.out-this.out.out)/c;
  }
}

class Diode {
  constructor(In) {
    this.In=In;
    this.out=new Output();
  }
  update() {
    if(this.In) {
      if(this.In.out>=0)
        this.out.out=this.In.out;
      else
        this.out.out=0;
    }
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
    var freq=this.baseF;
    if(this.shiftF)
      freq+=this.shiftF.out*this.gainF;
    this.sineOut.out=sineWave(time, freq);
    this.squareOut.out=squareWave(time, freq);
    this.sawOut.out=sawWave(time, freq);
  }
}

class Mixer {
  constructor(InA, InB, baseB, shiftB, gainB) {
    this.InA=InA;
    this.InB=InB;
    this.baseB=baseB;
    this.shiftB=shiftB;
    this.gainB=gainB;
    this.biasedOut=new Output();
    this.modulatedOut=new Output();
  }
  update() {
    var InputA;
    var InputB;
    if(this.InA)
      InputA=this.InA.out;
    else
      InputA=0;
    if(this.InB)
      InputB=this.InB.out;
    else
      InputB=0;
    
    if(InputA<0&&InputB<0)
      this.modulatedOut.out=InputA+InputB+InputA*InputB;
    else
      this.modulatedOut.out=InputA+InputB-InputA*InputB;
    
    var bias;
    if(this.shiftB)
      bias=this.baseB+this.gainB*this.shiftB.out;
    else
      bias=this.baseB;
      
    this.biasedOut.out=InputA*bias+InputB*(1-bias);
  }
}

class Speaker {
  constructor(In) {
    this.In=In;
    this.out=new Output();
    this.out.out=0;
  }
  update() {
    this.out.out=this.In.out;
  }
  output() {
    return this.out.out;
  }
}

class Modules {
  constructor() {
    this.modList=[];
  }
  updateAll() {
    this.modList.forEach(function(a) {
      a.update();
    });
  }
  addModule(mod) {
    this.modList.push(mod);
  }
}

//Code here v
var modules=new Modules();
var oscillatorA=new Oscillator(258.5, 0, 0);
var oscillatorB=new Oscillator(4, 0, 0);
var oscillatorC=new Oscillator(16, oscillatorB.squareOut, 8);
var capA=new Capacitor(oscillatorA.sineOut, 10, oscillatorB.sineOut, 4);
var ampA=new Amplifier(capA.out, 0, oscillatorC.sineOut, 2);
var speaker=new Speaker(ampA.modulatedOut);

modules.addModule(oscillatorA);
modules.addModule(oscillatorB);
modules.addModule(oscillatorC);
modules.addModule(capA);
modules.addModule(ampA);
modules.addModule(speaker);

export function dsp(t) {
  time=t;
  modules.updateAll();
  
  return speaker.output();
}

