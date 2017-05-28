
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

function noteFreq(n, b) {
  return b*Math.pow(2, (n-49)/12);
}

//Helper classes
class Output {
  constructor() {
    this.out;
  }
}

//Modules
class Sequencer {
  constructor(module, sequences, pattern, bpm, transpose, baseF) {
    module.addModule(this);
    this.sequences=sequences;
    this.pattern=pattern;
    this.bpm=bpm;
    this.baseF=baseF;
    this.transpose=transpose;
    this.out=new Output();
    this.out.out=0;
    this.sequenceSize=sequences[0].length;
  }
  update() {
    var currentNote=Math.floor((time*this.bpm/60)%this.sequenceSize);
    var currentPattern=Math.floor((time*this.bpm/60/this.sequenceSize)%this.pattern.length);
    
    this.out.out=noteFreq(this.sequences[this.pattern[currentPattern]][currentNote]+this.transpose, this.baseF);
  }
}

class Drum {
  constructor(module, sequences, pattern, bpm, baseF, fade) {
    module.addModule(this);
    this.sequences=sequences;
    this.pattern=pattern;
    this.bpm=bpm;
    this.baseF=baseF;
    this.sineOut=new Output();
    this.squareOut=new Output();
    this.sequenceSize=sequences[0].length;
    this.fade=fade;
  }
  update() {
    var currentNote=Math.floor((time*this.bpm/60)%this.sequenceSize);
    var currentPattern=Math.floor((time*this.bpm/60/this.sequenceSize)%this.pattern.length);
    
    if(this.sequences[this.pattern[currentPattern]][currentNote]) {
      this.sineOut.out=sineWave(time, this.baseF)/(1/this.fade+(time%(1/this.bpm*60)))/this.fade;
      this.squareOut.out=squareWave(time, this.baseF)/(1/this.fade+(time%(1/this.bpm*60)))/this.fade;
    } else {
      this.sineOut.out=0;
      this.squareOut.out=0;
    }
  }
}

class Filter {
  
}

class Amplifier {
  constructor(module, In, baseA, shiftA, gainA) {
    module.addModule(this);
    this.In=In;
    this.baseA=baseA;
    this.shiftA=shiftA;
    this.gainA=gainA;
    this.modulatedOut=new Output();
    this.multipliedOut=new Output();
    this.modulatedOut.out=0;
    this.multipliedOut.out=0;
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
        this.modulatedOut.out=-Math.pow(-this.In.out, 1/a);
      }
      else
        this.modulatedOut.out=Math.pow(this.In.out, 1/a);
      this.multipliedOut.out=this.In.out*a;
    } else {
      this.multipliedOut.out=0;
      this.modulatedOut.out=0;
    }
  }
}

class Capacitor {
  constructor(module, In, baseC, shiftC, gainC) {
    module.addModule(this);
    this.In=In;
    this.baseC=baseC;
    this.shiftC=shiftC;
    this.gainC=gainC;
    this.out=new Output();
    this.out.out=0;
  }
  update() {
    var c=this.baseC+1;
    if(this.shiftC)
      c+=this.shiftC.out*this.gainC;
    if(this.In)
      this.out.out+=(this.In.out-this.out.out)/c;
  }
}

class Diode {
  constructor(module, In) {
    module.addModule(this);
    this.In=In;
    this.out=new Output();
    this.out.out=0;
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

class Inverter {
  constructor(module, In) {
    module.addModule(this);
    this.In=In;
    this.out=new Output();
    this.out.out=0;
  }
  update() {
    if(this.In)
      this.out.out=-this.In.out;
    else
      this.out.out=0;
  }
}

class Oscillator {
  constructor(module, baseF, shiftF, gainF) {
    module.addModule(this);
    this.baseF=baseF;
    this.shiftF=shiftF;
    this.gainF=gainF;
    this.sineOut=new Output();
    this.squareOut=new Output();
    this.sawOut=new Output();
    this.sineOut.out=0;
    this.squareOut.out=0;
    this.sawOut.out=0;
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
  constructor(module, InA, InB, baseB, shiftB, gainB) {
    module.addModule(this);
    this.InA=InA;
    this.InB=InB;
    this.baseB=baseB;
    this.shiftB=shiftB;
    this.gainB=gainB;
    this.biasedOut=new Output();
    this.modulatedOut=new Output();
    this.biasedOut.out=0;
    this.modulatedOut.out=0;
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
  constructor(module, In) {
    module.addModule(this);
    this.In=In;
    this.out=new Output();
    this.out.out=0;
  }
  update() {
    this.out.out=this.In.out;
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

//Module controller
var modules=new Modules();



//Modules here v
var bass=new Drum(modules, [
    [1, 1, 0, 0, 1, 0, 1, 0]
    ],
    [0],
    320, 30, 10
  );
var tom=new Drum(modules, [
    [1, 0, 1, 0, 0, 1, 0, 0],
    [1, 1, 0, 1, 0, 1, 0, 1]
    ],
    [0, 0, 1, 1],
    320, 60, 50
  );
var tom2=new Drum(modules, [
    [1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0]
    ],
    [0, 0, 1, 1],
    320, 70, 50
  );
var snare=new Drum(modules, [
    [0, 1, 0, 1, 1, 1, 0, 1]
    ],
    [0],
    320, 140, 500
  );

var drumMixerA=new Mixer(modules, bass.sineOut, tom.sineOut, 0.5, 0, 0);
var drumMixerB=new Mixer(modules, drumMixerA.modulatedOut, snare.sineOut, 0.5, 0, 0);
var drumMixerC=new Mixer(modules, drumMixerB.modulatedOut, tom2.sineOut, 0.5, 0, 0);
var ampA=new Amplifier(modules, drumMixerB.modulatedOut, 0.75, 0, 0);

var speaker=new Speaker(modules, ampA.modulatedOut);
//Modules here ^

//Main function
export function dsp(t) {
  time=t;
  modules.updateAll();
  
  return modules.modList[modules.modList.length-1].out.out;
}



