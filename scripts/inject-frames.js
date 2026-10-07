// Inject 9 synthetic white-background frames into the Forge's bulk file
// input — exercises the REAL onChange path incl. background removal.
// (No template literals / backticks — bash-safe when passed via "$(cat ...)".')
(async () => {
  var files = [];
  for (var k = 0; k < 9; k++) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    var x = c.getContext('2d');
    x.fillStyle = '#f2f0ec'; x.fillRect(0, 0, 256, 256);
    var hue = Math.round(255 * k / 8);
    x.fillStyle = 'rgb(' + (255 - hue) + ',110,' + hue + ')';
    x.fillRect(64, 60, 128, 150);
    x.fillStyle = '#3b2f1a';
    x.fillRect(64 + Math.round(128 * k / 8), 60, 18, 22);
    x.fillStyle = '#b9862f';
    x.fillRect(84, 180, 88, 12);
    var blob = await new Promise(function (r) { c.toBlob(r, 'image/png'); });
    var name = 'relic_0' + k + '.png';
    files.push(new File([blob], name, { type: 'image/png' }));
  }
  var dt = new DataTransfer();
  files.forEach(function (f) { dt.items.add(f); });
  var input = document.querySelector('input[type=file][multiple]');
  if (!input) return 'NO BULK INPUT FOUND';
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return 'injected ' + files.length + ' files';
})()
