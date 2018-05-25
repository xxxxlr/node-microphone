var isMacOrWin = require('os').type() == 'Darwin' || require('os').type().indexOf('Windows') > -1;
var spawn = require('child_process').spawn
var PassThrough = require('stream').PassThrough;
// var lame = require('lame');

var _ps = null;

var audio = new PassThrough;
var info = new PassThrough;

var start = function (options) {
    options = options || {};
    options.device = options['device'] || 'default'
    options.recordProgram = options.recordProgram || 'rec'
    options.sampleRate = options.sampleRate || 16000
    options.cmdOptions = options.cmdOptions || {}
    switch (options.recordProgram) {
        case 'rec':
            // let cmdOptions = { encoding: 'binary' }
            if (options.device) {
                options.cmdOptions.env = Object.assign({}, process.env, { AUDIODEV: options.device })
            }
            options.cmdArgs = options.cmdArgs || [
                '-q',                     // show no progress
                '-r', options.sampleRate, // sample rate
                '-c', '1',                // channels
                '-e', 'signed-integer',   // sample encoding
                '-b', '16',               // precision (bits)
                '-t', 'wav',              // audio type
                '-',                      // pipe
                // end on silence
                // 'silence', '1', '0.1', options.thresholdStart || options.threshold + '%',
                // '1', options.silence, options.thresholdEnd || options.threshold + '%'
            ]
            _ps = spawn(
                options.recordProgram,
                options.cmdArgs,
                options.cmdOptions)
            break;
        case 'sox':
            options.cmdArgs = options.cmdArgs || ['-d', '-t', 'dat', '-p']
            break;

        case 'arecord':
            options.cmdArgs = options.cmdArgs || ['-D', options.device, '-r', 16000, '-f', 'S16_LE']
            // ps = spawn('arecord', ['-D', options.device, '-r', 16000]);
            break;
        default:
            console.error('Only support the following programs: rec, sox, arecord')
            break;

            _ps = spawn(options.recordProgram,
                options.cmdArgs,
                options.cmdOptions);
            console.log(`raw command line: ${options.recordProgram} ${options.cmdArgs.join(' ')}`)
    }
    if (_ps !== null) {
        if (options.mp3output === true) {
            var encoder = new lame.Encoder({
                channels: 2,
                bitDepth: 16,
                sampleRate: 44100
            });

            _ps.stdout.pipe(encoder);
            encoder.pipe(audio);
            _ps.stderr.pipe(info);

        } else {
            _ps.stdout.pipe(audio);
            _ps.stderr.pipe(info);

        }
    }
    // return ps
};

var stop = function () {
    if (_ps) {
        _ps.kill();
        _ps = null;
    }
};

exports.audioStream = audio;
exports.infoStream = info;
exports.startCapture = start;
exports.stopCapture = stop;
