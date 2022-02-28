import * as dat from 'dat.gui';

const gui = new dat.GUI();

class Options {
    metalness = 1;
    roughness = 0.3;
    envMapIntensity = 1;
}

const options = new Options();

gui.add(options, 'metalness', 0, 1);
gui.add(options, 'roughness', 0, 1);
gui.add(options, 'envMapIntensity', 0, 1);

export default options