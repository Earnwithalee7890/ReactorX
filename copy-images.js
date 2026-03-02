const fs = require('fs');
const path = require('path');

const brain = 'C:/Users/Dell/.gemini/antigravity/brain/602cf1b4-06f3-4f3d-94ef-5650a441acd0';
const pub = 'f:/Somnia Reactivity Mini Hackathon/frontend/public';

const files = [
    ['reactorx_logo_1772403225705.png', 'logo.png'],
    ['reactorx_favicon_1772403240574.png', 'favicon.png'],
    ['reactorx_hero_bg_1772403261844.png', 'hero-bg.png'],
];

for (const [src, dst] of files) {
    const from = path.join(brain, src);
    const to = path.join(pub, dst);
    try {
        fs.copyFileSync(from, to);
        console.log('Copied:', dst);
    } catch (e) {
        console.error('Failed:', e.message);
    }
}
